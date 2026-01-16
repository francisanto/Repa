import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { registerImageRoutes } from "./replit_integrations/image";
import { openai } from "./replit_integrations/image"; // Re-using openai client from image integration (it has the same config)
import { students, events, registrations, timetables } from "@shared/schema";
import { eq } from "drizzle-orm";

// Simple Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Integrations
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerAudioRoutes(app);
  registerImageRoutes(app);

  // === STUDENTS API ===
  app.get(api.students.list.path, async (req, res) => {
    const query = api.students.list.input?.parse(req.query);
    const result = await storage.getStudents(query?.search, query?.batch);
    res.json(result);
  });

  app.get(api.students.get.path, async (req, res) => {
    const student = await storage.getStudent(Number(req.params.id));
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  });

  app.post(api.students.create.path, async (req, res) => {
    try {
      const input = api.students.create.input.parse(req.body);
      const student = await storage.createStudent(input);
      res.status(201).json(student);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });
  
  app.post(api.students.bulkCreate.path, async (req, res) => {
      try {
          const input = api.students.bulkCreate.input.parse(req.body);
          const students = await storage.bulkCreateStudents(input);
          res.status(201).json(students);
      } catch (err) {
          if (err instanceof z.ZodError) {
              return res.status(400).json({ message: err.errors[0].message });
          }
          throw err;
      }
  });

  app.put(api.students.update.path, async (req, res) => {
    try {
      const input = api.students.update.input.parse(req.body);
      const student = await storage.updateStudent(Number(req.params.id), input);
      if (!student) return res.status(404).json({ message: "Student not found" });
      res.json(student);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.students.delete.path, async (req, res) => {
    await storage.deleteStudent(Number(req.params.id));
    res.status(204).send();
  });

  // === EVENTS API ===
  app.get(api.events.list.path, async (req, res) => {
    const result = await storage.getEvents();
    res.json(result);
  });

  app.get(api.events.get.path, async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  app.post(api.events.create.path, async (req, res) => {
    try {
      const input = api.events.create.input.parse(req.body);
      const event = await storage.createEvent(input);
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === REGISTRATIONS API (With Fuzzy Match) ===
  app.post(api.registrations.create.path, async (req, res) => {
    try {
      const { eventId, studentName } = api.registrations.create.input.parse(req.body);
      
      // 1. Fuzzy Match Logic
      const allStudents = await storage.getStudents();
      let bestMatch = null;
      let minDistance = Infinity;

      // Normalize input name
      const normalizedInput = studentName.toLowerCase().trim();

      for (const student of allStudents) {
        const normalizedStudentName = student.name.toLowerCase().trim();
        const distance = levenshtein(normalizedInput, normalizedStudentName);
        
        // Threshold for match (e.g. distance < 3 or < 20% of length)
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = student;
        }
      }

      // Check if match is good enough (simple heuristic: distance <= 3 for now)
      if (!bestMatch || minDistance > 3) {
        return res.status(404).json({ message: "Student not found. Please check spelling." });
      }

      // 2. Check if already registered
      const existingReg = await storage.getRegistrationByStudentAndEvent(bestMatch.id, eventId);
      if (existingReg) {
          return res.status(400).json({ message: `Already registered as ${bestMatch.name}` });
      }

      // 3. Create Registration
      const registration = await storage.createRegistration({
        eventId,
        studentId: bestMatch.id,
        status: "registered",
        paymentId: null, // Initial registration
      });

      res.status(201).json({ ...registration, studentName: bestMatch.name });

    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.registrations.list.path, async (req, res) => {
      const query = api.registrations.list.input?.parse(req.query);
      const results = await storage.getRegistrations(query?.eventId);
      
      // Enrich with student names (inefficient for large datasets but ok for MVP)
      const enriched = await Promise.all(results.map(async (reg) => {
          const student = await storage.getStudent(reg.studentId);
          return { ...reg, studentName: student?.name };
      }));
      
      res.json(enriched);
  });

  // === TIMETABLES API (With AI Parsing) ===
  app.get(api.timetables.list.path, async (req, res) => {
      const results = await storage.getTimetables();
      res.json(results);
  });

  app.post(api.timetables.upload.path, async (req, res) => {
      try {
          const { batch, image } = api.timetables.upload.input.parse(req.body);

          // AI Parsing using GPT-4o
          const response = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                  {
                      role: "system",
                      content: "You are an assistant that extracts timetable data from images. Output ONLY valid JSON in the format: { [day]: [ { time: 'HH:MM', subject: 'Subject', room: 'Room' } ] }. Days should be Monday, Tuesday, etc."
                  },
                  {
                      role: "user",
                      content: [
                          { type: "text", text: "Extract the timetable from this image." },
                          { type: "image_url", image_url: { url: image } } // image is expected to be data:image/png;base64,...
                      ]
                  }
              ],
              response_format: { type: "json_object" }
          });

          const content = JSON.parse(response.choices[0].message.content || "{}");

          const timetable = await storage.createTimetable({
              batch,
              content,
              uploadedBy: "admin", // TODO: use real user if authenticated
          });

          res.status(201).json(timetable);

      } catch (err) {
           console.error("Timetable upload error:", err);
          if (err instanceof z.ZodError) {
              return res.status(400).json({ message: err.errors[0].message });
          }
          res.status(500).json({ message: "Failed to process timetable" });
      }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingStudents = await storage.getStudents();
  if (existingStudents.length === 0) {
    await storage.createStudent({
      name: "John Doe",
      rollNo: "CS2023001",
      batch: "CS-A",
      email: "john@example.com",
      phone: "1234567890",
    });
    await storage.createStudent({
      name: "Jane Smith",
      rollNo: "CS2023002",
      batch: "CS-A",
      email: "jane@example.com",
      phone: "0987654321",
    });
     await storage.createStudent({
      name: "Alice Johnson",
      rollNo: "CS2023003",
      batch: "CS-B",
      email: "alice@example.com",
      phone: "1122334455",
    });
  }

  const existingEvents = await storage.getEvents();
  if (existingEvents.length === 0) {
      await storage.createEvent({
          title: "Freshers Party 2026",
          description: "Welcome party for new batch",
          date: new Date("2026-02-15T18:00:00"),
          location: "Main Auditorium",
          amount: 500,
          isPaymentRequired: true,
          organizerId: "admin"
      });
  }
}
