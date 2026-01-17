import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
// import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth"; // Not using Replit Auth anymore
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { registerImageRoutes } from "./replit_integrations/image";
import { getOpenAI } from "./replit_integrations/image"; // Re-using getOpenAI from image integration
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import Razorpay from "razorpay";
import * as crypto from "crypto";
import { students, events, registrations, timetables } from "@shared/schema";
import { eq } from "drizzle-orm";

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
  const PostgresStore = pgSession(session);

  app.use(session({
    store: new PostgresStore({
      pool: pool as any,
      tableName: "session"
    }),
    secret: process.env.SESSION_SECRET || "classrep-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, 
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax"
    }
  }));

  // Initialize Razorpay (default MID: S4yrsJtpeiuw2a)
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "S4yrsJtpeiuw2a";
  const razorpay = razorpayKeyId && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: razorpayKeyId,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

  // === AI CHAT API ===
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get events and timetables for context
      const allEvents = await storage.getEvents();
      const allTimetables = await storage.getTimetables();
      const allStudents = await storage.getStudents();

      // Use OpenAI to answer queries with better context
      const openai = getOpenAI();
      const eventsContext = allEvents.slice(0, 10).map(e => ({
        title: e.title,
        date: new Date(e.date).toLocaleDateString(),
        description: e.description?.substring(0, 100) || "",
        location: e.location || "TBD"
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant for a college class management system called Repa. 
            You help students with queries about:
            - Class schedules and timetables
            - Upcoming events and activities
            - Exam dates and holidays
            - General college and academic questions
            - Assignment deadlines
            - Class locations and room numbers
            - Any college-related information

            Context Information:
            - Upcoming Events: ${JSON.stringify(eventsContext)}
            - Total Students: ${allStudents.length}
            - Active Timetables: ${allTimetables.length}

            Guidelines:
            1. For questions about tomorrow/holidays, check if any events are scheduled. If an event is on that date, it might be a holiday or special day.
            2. For timetable queries, mention that timetables can be viewed on the website.
            3. For general college questions (courses, exams, academic policies), provide helpful answers based on typical college practices.
            4. Always be friendly, accurate, and helpful.
            5. If you don't have specific information, suggest checking the events page or contacting the class representative.
            6. For questions like "is tomorrow holiday" - check the events for tomorrow's date and respond accordingly.`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      res.json({ response: response.choices[0]?.message?.content || "I'm here to help with college-related queries. How can I assist you today?" });
    } catch (error: any) {
      console.error("AI chat error:", error);
      res.status(500).json({ response: "I'm having trouble right now. Please try again or contact your class representative for assistance." });
    }
  });

  // === AUTH API (Simple ID/Password) ===
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { representativeId, password, name, email } = req.body;
      
      if (!representativeId || !password || !name) {
        return res.status(400).json({ message: "Representative ID, password, and name are required" });
      }

      // Check if representative already exists
      const existing = await storage.getRepresentative(representativeId);
      if (existing) {
        return res.status(400).json({ message: "Representative ID already exists" });
      }

      // Simple password storage (in production, use bcrypt)
      const rep = await storage.createRepresentative({
        representativeId,
        password, // In production: await bcrypt.hash(password, 10)
        name,
        email: email || null,
      });

      // Auto-login after registration
      (req.session as any).userId = rep.id;
      (req.session as any).representativeId = rep.representativeId;
      (req.session as any).name = rep.name;

      res.status(201).json({ 
        id: rep.id,
        representativeId: rep.representativeId,
        name: rep.name,
        email: rep.email
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { representativeId, password } = req.body;
      
      if (!representativeId || !password) {
        return res.status(400).json({ message: "Representative ID and password are required" });
      }

      const rep = await storage.getRepresentative(representativeId);
      if (!rep || rep.password !== password) { // In production: await bcrypt.compare(password, rep.password)
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      (req.session as any).userId = rep.id;
      (req.session as any).representativeId = rep.representativeId;
      (req.session as any).name = rep.name;

      res.json({ 
        id: rep.id,
        representativeId: rep.representativeId,
        name: rep.name,
        email: rep.email
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    const session = req.session as any;
    if (session?.userId) {
      res.json({
        id: session.userId,
        representativeId: session.representativeId,
        name: session.name,
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Setup Integrations (keeping for other features, but not using Replit Auth)
  // await setupAuth(app);
  // registerAuthRoutes(app);
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

  // === STUDENT IMPORT FROM IMAGE/FILE ===
  app.post("/api/students/import-image", async (req, res) => {
    try {
      const { image, batch } = req.body;
      
      if (!image) {
        return res.status(400).json({ message: "Image data is required" });
      }

      // Use OpenAI Vision to extract student data from image
      const openai = getOpenAI();
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert data extraction assistant. Your task is to analyze images containing student lists, rosters, or class information and extract student data accurately.

            IMPORTANT INSTRUCTIONS:
            1. Identify the type of image: student list, roster, class roll call, attendance sheet, etc.
            2. Extract ALL visible student information: names, roll numbers, IDs, emails, phone numbers, batches, etc.
            3. Parse table structures, lists, or any format accurately
            4. Handle various formats: tables, numbered lists, cards, etc.
            5. Extract roll numbers/IDs even if labeled differently (Roll No, ID, Student ID, Reg No, etc.)
            6. Extract names carefully, preserving spelling
            7. Extract batch/class/section if available
            8. Extract email and phone if visible
            9. Output ONLY valid JSON array in this exact format:
            [
              {"name": "John Doe", "rollNo": "CS2023001", "batch": "CS-A", "email": "john@example.com", "phone": "1234567890"},
              {"name": "Jane Smith", "rollNo": "CS2023002", "batch": "CS-A", "email": "jane@example.com", "phone": "0987654321"},
              ...
            ]
            10. Include all fields that are available, use empty string or null for missing data
            11. If batch is provided in the request, use that for all students
            12. Be very careful to read all text accurately from the image`
          },
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: `Extract all student information from this image. ${batch ? `Default batch: ${batch}` : ""} Extract names, roll numbers, and any other available information accurately.` 
              },
              { 
                type: "image_url", 
                image_url: { 
                  url: image,
                  detail: "high" // Use high detail for better accuracy
                } 
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Lower temperature for accurate extraction
        max_tokens: 2000
      });

      let studentsData: any[] = [];
      try {
        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        // Handle both array and object with array property
        studentsData = Array.isArray(parsed) ? parsed : (parsed.students || parsed.data || []);
        
        if (!Array.isArray(studentsData)) {
          throw new Error("Invalid format: expected array of students");
        }
      } catch (parseError: any) {
        return res.status(400).json({ 
          message: `Failed to parse extracted data: ${parseError.message}. Please ensure the image contains a clear student list.` 
        });
      }

      if (studentsData.length === 0) {
        return res.status(400).json({ message: "No student data found in the image. Please check the image quality and ensure it contains a student list." });
      }

      // Normalize and validate student data
      const normalizedStudents = studentsData.map((s: any) => ({
        name: s.name?.toString().trim() || "",
        rollNo: s.rollNo?.toString().trim() || s.roll_number?.toString().trim() || s.id?.toString().trim() || "",
        batch: batch || s.batch?.toString().trim() || s.class?.toString().trim() || "Default",
        email: s.email?.toString().trim() || null,
        phone: s.phone?.toString().trim() || s.mobile?.toString().trim() || null,
      })).filter(s => s.name && s.rollNo); // Filter out invalid entries

      if (normalizedStudents.length === 0) {
        return res.status(400).json({ message: "No valid student records found. Ensure the image contains names and roll numbers." });
      }

      // Bulk create students
      const created = await storage.bulkCreateStudents(normalizedStudents);

      res.status(201).json({
        imported: created.length,
        students: created,
      });
    } catch (err: any) {
      console.error("Student image import error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ 
        message: err.message || "Failed to process student list image. Please ensure the image is clear and contains a readable student list." 
      });
    }
  });

  // === RAZORPAY PAYMENT API ===
  app.post("/api/payments/create-order", async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(500).json({ message: "Payment gateway not configured" });
      }

      const { eventId, amount, studentName } = req.body;
      
      if (!eventId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Valid event ID and amount required" });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency: "INR",
        receipt: `event_${eventId}_${Date.now()}`,
        notes: {
          eventId: eventId.toString(),
          studentName: studentName || "Student",
        },
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId,
      });
    } catch (error: any) {
      console.error("Razorpay order creation error:", error);
      res.status(500).json({ message: error.message || "Failed to create payment order" });
    }
  });

  // === RAZORPAY WEBHOOK ===
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(500).json({ message: "Payment gateway not configured" });
      }

      const { event, payload } = req.body;

      if (event === "payment.captured") {
        const { order_id, payment_id, amount, notes } = payload.payment.entity;
        const eventId = parseInt(notes?.eventId);

        if (eventId) {
          // Find registration by order ID and update payment status
          const registrations = await storage.getRegistrations(eventId);
          const registration = registrations.find((r: any) => r.razorpayOrderId === order_id);

          if (registration) {
            await storage.updateRegistration(registration.id, {
              razorpayPaymentId: payment_id,
              paymentStatus: "paid",
              status: "paid",
              amount: amount / 100, // Convert from paise
            });
          }
        }
      }

      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // === REGISTRATIONS API (With Enhanced Fuzzy Match & Payment) ===
  app.post(api.registrations.create.path, async (req, res) => {
    try {
      const { eventId, studentName, orderId, paymentId } = api.registrations.create.input.parse(req.body);
      
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

      // 3. Get event to check if payment is required
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const eventAmount = event.amount || 0;

      // 4. Create Registration
      const registration = await storage.createRegistration({
        eventId,
        studentId: matchResult.student.id,
        status: eventAmount > 0 && !paymentId ? "registered" : "paid",
        paymentId: paymentId || null,
        razorpayOrderId: orderId || null,
        razorpayPaymentId: paymentId || null,
        amount: eventAmount,
        paymentStatus: eventAmount > 0 && paymentId ? "paid" : eventAmount > 0 ? "pending" : null,
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

          // AI Parsing using GPT-4o with improved prompts
          const openai = getOpenAI();
          const response = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                  {
                      role: "system",
                      content: `You are an expert timetable extraction assistant. Your task is to analyze timetable images and extract all class schedule information accurately.

                      IMPORTANT INSTRUCTIONS:
                      1. Identify the type of image: Is it a weekly timetable, daily schedule, or class schedule?
                      2. Extract ALL visible information: days, times, subjects, room numbers, teacher names (if available)
                      3. Parse time formats correctly: Handle formats like "9:00-10:00", "9 AM", "09:00", etc.
                      4. Identify days accurately: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
                      5. Extract subject names as written
                      6. Extract room numbers/locations (e.g., "Room 101", "Lab 3", "A-201")
                      7. Output ONLY valid JSON in this exact format:
                      {
                        "Monday": [{"time": "09:00-10:00", "subject": "Mathematics", "room": "Room 101"}],
                        "Tuesday": [{"time": "10:00-11:00", "subject": "Physics", "room": "Lab 1"}],
                        ...
                      }
                      8. If a day has multiple periods, include all of them as an array
                      9. If time is in a range format, use the start time in the "time" field (e.g., "09:00" from "9:00-10:00")
                      10. Be very careful to read all text accurately from the image`
                  },
                  {
                      role: "user",
                      content: [
                          { 
                              type: "text", 
                              text: "Carefully analyze this timetable image. Identify all days, times, subjects, and room numbers. Extract the complete schedule information accurately." 
                          },
                          { 
                              type: "image_url", 
                              image_url: { 
                                  url: image,
                                  detail: "high" // Use high detail for better accuracy
                              } 
                          }
                      ]
                  }
              ],
              response_format: { type: "json_object" },
              temperature: 0.1, // Lower temperature for more accurate extraction
              max_tokens: 2000
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
