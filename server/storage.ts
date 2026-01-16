import {
  students, events, registrations, timetables,
  type Student, type InsertStudent,
  type Event, type InsertEvent,
  type Registration, type InsertRegistration,
  type Timetable, type InsertTimetable
} from "@shared/schema";
import { db } from "./db";
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

  // Timetables
  getTimetables(): Promise<Timetable[]>;
  createTimetable(timetable: InsertTimetable): Promise<Timetable>;
}

export class DatabaseStorage implements IStorage {
  // Students
  async getStudents(search?: string, batch?: string): Promise<Student[]> {
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
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student> {
    const [updated] = await db.update(students).set(updates).where(eq(students.id, id)).returning();
    return updated;
  }

  async deleteStudent(id: number): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  async bulkCreateStudents(studentsData: InsertStudent[]): Promise<Student[]> {
      return await db.insert(students).values(studentsData).returning();
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return db.select().from(events);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  // Registrations
  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const [registration] = await db.insert(registrations).values(insertRegistration).returning();
    return registration;
  }

  async getRegistrations(eventId?: number): Promise<Registration[]> {
      if (eventId) {
          return db.select().from(registrations).where(eq(registrations.eventId, eventId));
      }
      return db.select().from(registrations);
  }

  async getRegistrationByStudentAndEvent(studentId: number, eventId: number): Promise<Registration | undefined> {
      const [reg] = await db.select().from(registrations)
        .where(and(
            eq(registrations.studentId, studentId),
            eq(registrations.eventId, eventId)
        ));
      return reg;
  }

  // Timetables
  async getTimetables(): Promise<Timetable[]> {
    return db.select().from(timetables);
  }

  async createTimetable(insertTimetable: InsertTimetable): Promise<Timetable> {
    const [timetable] = await db.insert(timetables).values(insertTimetable).returning();
    return timetable;
  }
}

export const storage = new DatabaseStorage();
