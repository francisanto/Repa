import {
  students, events, registrations, timetables, representatives,
  type Student, type InsertStudent,
  type Event, type InsertEvent,
  type Registration, type InsertRegistration,
  type Timetable, type InsertTimetable,
  type Representative, type InsertRepresentative
} from "@shared/schema";
import { eq, ilike, or, and } from "drizzle-orm";

export interface IStorage {
  // Students
  getStudents(search?: string, batch?: string): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;
  bulkCreateStudents(studentsData: InsertStudent[]): Promise<Student[]>;
  
  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;

  // Registrations
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getRegistrations(eventId?: number): Promise<Registration[]>;
  getRegistrationByStudentAndEvent(studentId: number, eventId: number): Promise<Registration | undefined>;
  updateRegistration(id: number, updates: Partial<InsertRegistration>): Promise<Registration>;

  // Timetables
  getTimetables(): Promise<Timetable[]>;
  createTimetable(timetable: InsertTimetable): Promise<Timetable>;

  // Representatives
  getRepresentative(representativeId: string): Promise<Representative | undefined>;
  createRepresentative(rep: InsertRepresentative): Promise<Representative>;
}

export class DatabaseStorage implements IStorage {
  private getDb() {
    // Lazy import to avoid error when DATABASE_URL is not set
    const { db } = require("./db");
    return db;
  }

  // Students
  async getStudents(search?: string, batch?: string): Promise<Student[]> {
    const db = this.getDb();
    let query = db.select().from(students);
    const conditions = [];
    
    if (search) {
      conditions.push(or(
        ilike(students.name, `%${search}%`),
        ilike(students.rollNo, `%${search}%`)
      ));
    }
    
    if (batch) {
      conditions.push(eq(students.batch, batch));
    }

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    
    return query;
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const db = this.getDb();
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const db = this.getDb();
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student> {
    const db = this.getDb();
    const [updated] = await db.update(students).set(updates).where(eq(students.id, id)).returning();
    return updated;
  }

  async deleteStudent(id: number): Promise<void> {
    const db = this.getDb();
    await db.delete(students).where(eq(students.id, id));
  }

  async bulkCreateStudents(studentsData: InsertStudent[]): Promise<Student[]> {
    const db = this.getDb();
    return await db.insert(students).values(studentsData).returning();
  }

  // Events
  async getEvents(): Promise<Event[]> {
    const db = this.getDb();
    return db.select().from(events);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const db = this.getDb();
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const db = this.getDb();
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  // Registrations
  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const db = this.getDb();
    const [registration] = await db.insert(registrations).values(insertRegistration).returning();
    return registration;
  }

  async getRegistrations(eventId?: number): Promise<Registration[]> {
    const db = this.getDb();
    if (eventId) {
        return db.select().from(registrations).where(eq(registrations.eventId, eventId));
    }
    return db.select().from(registrations);
  }

  async getRegistrationByStudentAndEvent(studentId: number, eventId: number): Promise<Registration | undefined> {
    const db = this.getDb();
    const [reg] = await db.select().from(registrations)
      .where(and(
          eq(registrations.studentId, studentId),
          eq(registrations.eventId, eventId)
      ));
    return reg;
  }

  async updateRegistration(id: number, updates: Partial<InsertRegistration>): Promise<Registration> {
    const db = this.getDb();
    const [updated] = await db.update(registrations)
      .set(updates)
      .where(eq(registrations.id, id))
      .returning();
    if (!updated) throw new Error("Registration not found");
    return updated;
  }

  // Timetables
  async getTimetables(): Promise<Timetable[]> {
    const db = this.getDb();
    return db.select().from(timetables);
  }

  async createTimetable(insertTimetable: InsertTimetable): Promise<Timetable> {
    const db = this.getDb();
    const [timetable] = await db.insert(timetables).values(insertTimetable).returning();
    return timetable;
  }

  // Representatives
  async getRepresentative(representativeId: string): Promise<Representative | undefined> {
    const db = this.getDb();
    const [rep] = await db.select().from(representatives).where(eq(representatives.representativeId, representativeId));
    return rep;
  }

  async createRepresentative(rep: InsertRepresentative): Promise<Representative> {
    const db = this.getDb();
    const [newRep] = await db.insert(representatives).values(rep).returning();
    return newRep;
  }
}

// Use database if DATABASE_URL is set (Replit provides this automatically)
const databaseUrl = process.env.DATABASE_URL;

let storageInstance: IStorage;

if (process.env.USE_MEMORY_STORAGE === "true" || !databaseUrl) {
  const { MemoryStorage } = require("./memory-storage");
  storageInstance = new MemoryStorage();
  console.log("📦 Using in-memory storage");
} else {
  storageInstance = new DatabaseStorage();
  console.log("💾 Using PostgreSQL database");
}

export const storage = storageInstance;
