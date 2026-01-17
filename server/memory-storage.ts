import type {
  Student, InsertStudent,
  Event, InsertEvent,
  Registration, InsertRegistration,
  Timetable, InsertTimetable,
  Representative, InsertRepresentative
} from "@shared/schema";
import type { IStorage } from "./storage";

// Simple in-memory storage for testing without database
export class MemoryStorage implements IStorage {
  private students: Student[] = [];
  private events: Event[] = [];
  private registrations: Registration[] = [];
  private timetables: Timetable[] = [];
  private representatives: Representative[] = [];
  private nextStudentId = 1;
  private nextEventId = 1;
  private nextRegistrationId = 1;
  private nextTimetableId = 1;
  private nextRepresentativeId = 1;

  // Representatives
  async getRepresentative(representativeId: string): Promise<Representative | undefined> {
    return this.representatives.find(r => r.representativeId === representativeId);
  }

  async createRepresentative(rep: InsertRepresentative): Promise<Representative> {
    const newRep: Representative = {
      id: this.nextRepresentativeId++,
      ...rep,
      createdAt: new Date(),
    };
    this.representatives.push(newRep);
    return newRep;
  }

  // Students
  async getStudents(search?: string, batch?: string): Promise<Student[]> {
    let result = [...this.students];
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.rollNo.toLowerCase().includes(searchLower)
      );
    }
    
    if (batch) {
      result = result.filter(s => s.batch === batch);
    }
    
    return result;
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.find(s => s.id === id);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const newStudent: Student = {
      id: this.nextStudentId++,
      ...student,
      createdAt: new Date(),
    };
    this.students.push(newStudent);
    return newStudent;
  }

  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student> {
    const index = this.students.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Student not found");
    this.students[index] = { ...this.students[index], ...updates };
    return this.students[index];
  }

  async deleteStudent(id: number): Promise<void> {
    this.students = this.students.filter(s => s.id !== id);
  }

  async bulkCreateStudents(studentsData: InsertStudent[]): Promise<Student[]> {
    const newStudents = studentsData.map(data => ({
      id: this.nextStudentId++,
      ...data,
      createdAt: new Date(),
    }));
    this.students.push(...newStudents);
    return newStudents;
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return [...this.events];
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.find(e => e.id === id);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const newEvent: Event = {
      id: this.nextEventId++,
      ...event,
      createdAt: new Date(),
    };
    this.events.push(newEvent);
    return newEvent;
  }

  // Registrations
  async createRegistration(registration: InsertRegistration): Promise<Registration> {
    const newReg: Registration = {
      id: this.nextRegistrationId++,
      ...registration,
      createdAt: new Date(),
    };
    this.registrations.push(newReg);
    return newReg;
  }

  async getRegistrations(eventId?: number): Promise<Registration[]> {
    if (eventId) {
      return this.registrations.filter(r => r.eventId === eventId);
    }
    return [...this.registrations];
  }

  async getRegistrationByStudentAndEvent(studentId: number, eventId: number): Promise<Registration | undefined> {
    return this.registrations.find(r => 
      r.studentId === studentId && r.eventId === eventId
    );
  }

  // Timetables
  async getTimetables(): Promise<Timetable[]> {
    return [...this.timetables];
  }

  async createTimetable(timetable: InsertTimetable): Promise<Timetable> {
    const newTimetable: Timetable = {
      id: this.nextTimetableId++,
      ...timetable,
      createdAt: new Date(),
    };
    this.timetables.push(newTimetable);
    return newTimetable;
  }
}

