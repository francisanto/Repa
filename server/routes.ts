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

// Enhanced fuzzy matching with multiple algorithms
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

// Jaro-Winkler similarity for better name matching
function jaroWinkler(s1: string, s2: string): number {
  const jaro = jaroDistance(s1, s2);
  const prefixLength = commonPrefixLength(s1, s2, 4);
  return jaro + (0.1 * prefixLength * (1 - jaro));
}

function jaroDistance(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3.0;
}

function commonPrefixLength(s1: string, s2: string, maxLength: number): number {
  let prefix = 0;
  for (let i = 0; i < Math.min(maxLength, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return prefix;
}

// Enhanced name matching with multiple algorithms
function findBestMatch(inputName: string, students: any[]): { student: any; score: number; method: string } | null {
  const normalizedInput = inputName.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;
  let bestMethod = "";

  for (const student of students) {
    const normalizedStudentName = student.name.toLowerCase().trim();
    
    // Exact match
    if (normalizedInput === normalizedStudentName) {
      return { student, score: 1.0, method: "exact" };
    }

    // Jaro-Winkler (better for names)
    const jwScore = jaroWinkler(normalizedInput, normalizedStudentName);
    if (jwScore > bestScore && jwScore > 0.85) {
      bestScore = jwScore;
      bestMatch = student;
      bestMethod = "jaro-winkler";
    }

    // Levenshtein distance (normalized)
    const maxLen = Math.max(normalizedInput.length, normalizedStudentName.length);
    const levDistance = levenshtein(normalizedInput, normalizedStudentName);
    const levScore = 1 - (levDistance / maxLen);
    
    if (levScore > bestScore && levScore > 0.7 && (!bestMatch || levScore > jwScore)) {
      bestScore = levScore;
      bestMatch = student;
      bestMethod = "levenshtein";
    }

    // Contains check (fallback)
    if (normalizedStudentName.includes(normalizedInput) || normalizedInput.includes(normalizedStudentName)) {
      const containsScore = 0.6;
      if (containsScore > bestScore && !bestMatch) {
        bestScore = containsScore;
        bestMatch = student;
        bestMethod = "contains";
      }
    }
  }

  return bestMatch ? { student: bestMatch, score: bestScore, method: bestMethod } : null;
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

  // === GOOGLE SHEETS IMPORT ===
  app.post(api.students.importFromGoogleSheets.path, async (req, res) => {
    try {
      const { sheetUrl, sheetName } = api.students.importFromGoogleSheets.input.parse(req.body);
      
      // Extract Google Sheets ID from URL
      const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetIdMatch) {
        return res.status(400).json({ message: "Invalid Google Sheets URL" });
      }
      
      const sheetId = sheetIdMatch[1];
      const range = sheetName ? `${sheetName}!A:Z` : "Sheet1!A:Z";
      
      // Fetch data from Google Sheets (public sheet or using API key)
      // For public sheets, we can use the CSV export URL
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName || "Sheet1"}`;
      
      try {
        const response = await fetch(csvUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch sheet data. Make sure the sheet is publicly accessible.");
        }
        
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          return res.status(400).json({ message: "Sheet appears to be empty or has no data rows" });
        }
        
        // Parse CSV (simple parser - assumes comma-separated)
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const studentsData: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          if (values.length === 0 || !values[0]) continue; // Skip empty rows
          
          // Try to map common column names
          const nameIndex = headers.findIndex(h => 
            /name|full.?name|student.?name/i.test(h)
          );
          const rollNoIndex = headers.findIndex(h => 
            /roll|roll.?no|roll.?number|id|student.?id/i.test(h)
          );
          const batchIndex = headers.findIndex(h => 
            /batch|class|section/i.test(h)
          );
          const emailIndex = headers.findIndex(h => 
            /email/i.test(h)
          );
          const phoneIndex = headers.findIndex(h => 
            /phone|mobile|contact/i.test(h)
          );
          
          if (nameIndex === -1 || rollNoIndex === -1) {
            continue; // Skip rows without required fields
          }
          
          studentsData.push({
            name: values[nameIndex] || "",
            rollNo: values[rollNoIndex] || "",
            batch: values[batchIndex] || "Default",
            email: values[emailIndex] || null,
            phone: values[phoneIndex] || null,
          });
        }
        
        if (studentsData.length === 0) {
          return res.status(400).json({ message: "No valid student data found in sheet" });
        }
        
        // Bulk create students
        const created = await storage.bulkCreateStudents(studentsData);
        
        res.status(201).json({
          imported: created.length,
          students: created,
        });
      } catch (fetchError: any) {
        return res.status(400).json({ 
          message: `Failed to import from Google Sheets: ${fetchError.message}. Make sure the sheet is publicly accessible (File > Share > Anyone with the link can view).` 
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === REGISTRATIONS API (With Enhanced Fuzzy Match) ===
  app.post(api.registrations.create.path, async (req, res) => {
    try {
      const { eventId, studentName } = api.registrations.create.input.parse(req.body);
      
      // 1. Enhanced Fuzzy Match Logic
      const allStudents = await storage.getStudents();
      const matchResult = findBestMatch(studentName, allStudents);

      if (!matchResult || matchResult.score < 0.7) {
        return res.status(404).json({ 
          message: "Student not found. Please check spelling or contact your representative.",
          suggestions: allStudents.slice(0, 3).map(s => s.name)
        });
      }

      // 2. Check if already registered
      const existingReg = await storage.getRegistrationByStudentAndEvent(matchResult.student.id, eventId);
      if (existingReg) {
          return res.status(400).json({ message: `Already registered as ${matchResult.student.name}` });
      }

      // 3. Create Registration
      const registration = await storage.createRegistration({
        eventId,
        studentId: matchResult.student.id,
        status: "registered",
        paymentId: null, // Initial registration
      });

      res.status(201).json({ 
        ...registration, 
        studentName: matchResult.student.name,
        matchConfidence: matchResult.score,
        matchMethod: matchResult.method
      });

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
