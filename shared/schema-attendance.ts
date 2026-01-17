// Additional schema definitions for attendance and leave letters
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  batch: text("batch").notNull(),
  attendanceData: jsonb("attendance_data").notNull(), // { studentId: "present/absent" }
  uploadedBy: text("uploaded_by").notNull(),
  imageUrl: text("image_url"), // Original attendance sheet image
  createdAt: timestamp("created_at").defaultNow(),
});

export const leaveLetters = pgTable("leave_letters", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  studentName: text("student_name").notNull(),
  date: timestamp("date").notNull(),
  reason: text("reason"), // Extracted from letter
  imageUrl: text("image_url").notNull(), // Leave letter image
  status: text("status").default("pending"), // pending, approved, rejected
  classifiedCategory: text("classified_category"), // AI classification
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

