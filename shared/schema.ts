import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export everything from auth and chat models
export * from "./models/auth";
export * from "./models/chat";
export * from "./schema-attendance";

// === TABLE DEFINITIONS ===

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rollNo: text("roll_no").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  batch: text("batch").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  location: text("location"),
  amount: integer("amount").default(0), // Amount in cents/paise
  isPaymentRequired: boolean("is_payment_required").default(false),
  organizerId: text("organizer_id").notNull(), // Links to auth user
  posterUrl: text("poster_url"), // Event poster/image URL
  reminderDate: timestamp("reminder_date"), // When to send reminder notification
  reminderSent: boolean("reminder_sent").default(false), // Whether reminder was sent
  createdAt: timestamp("created_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  message: text("message").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  sent: boolean("sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  studentId: integer("student_id").notNull(),
  status: text("status").default("registered"), // registered, paid, cancelled
  paymentId: text("payment_id"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  amount: integer("amount").default(0),
  paymentStatus: text("payment_status"), // pending, paid, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const timetables = pgTable("timetables", {
  id: serial("id").primaryKey(),
  batch: text("batch").notNull(),
  content: jsonb("content").notNull(), // Structure: { [day]: [ { time, subject, room } ] }
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const representatives = pgTable("representatives", {
  id: serial("id").primaryKey(),
  representativeId: text("representative_id").notNull().unique(), // Login ID
  password: text("password").notNull(), // Hashed password
  name: text("name").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===

export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertRegistrationSchema = createInsertSchema(registrations).omit({ id: true, createdAt: true });
export const insertTimetableSchema = createInsertSchema(timetables).omit({ id: true, createdAt: true });
export const insertRepresentativeSchema = createInsertSchema(representatives).omit({ id: true, createdAt: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true });

// === TYPES ===

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;

export type Timetable = typeof timetables.$inferSelect;
export type InsertTimetable = z.infer<typeof insertTimetableSchema>;

export type Representative = typeof representatives.$inferSelect;
export type InsertRepresentative = z.infer<typeof insertRepresentativeSchema>;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

// Request Types
export type CreateStudentRequest = InsertStudent;
export type CreateEventRequest = InsertEvent;
export type CreateRegistrationRequest = InsertRegistration;
export type UploadTimetableRequest = { batch: string; file: string }; // File as base64 or handled via upload endpoint

// Response Types
export type StudentResponse = Student;
export type EventResponse = Event;
export type RegistrationResponse = Registration & { studentName?: string; eventTitle?: string };

// Search/Filter Types
export interface StudentQueryParams {
  search?: string;
  batch?: string;
}
