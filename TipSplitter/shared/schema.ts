import { pgTable, text, serial, integer, boolean, json, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Restaurant configuration table
export const restaurantConfig = pgTable("restaurant_config", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertRestaurantConfigSchema = createInsertSchema(restaurantConfig).pick({
  name: true,
});

export type RestaurantConfig = typeof restaurantConfig.$inferSelect;
export type InsertRestaurantConfig = z.infer<typeof insertRestaurantConfigSchema>;

// Shift types table
export const shiftTypes = pgTable("shift_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertShiftTypeSchema = createInsertSchema(shiftTypes).pick({
  name: true,
});

export type ShiftType = typeof shiftTypes.$inferSelect;
export type InsertShiftType = z.infer<typeof insertShiftTypeSchema>;

// Positions table
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  pointValue: real("point_value").notNull().default(1.0),
});

export const insertPositionSchema = createInsertSchema(positions).pick({
  name: true,
  pointValue: true,
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  positions: json("positions").notNull().$type<string[]>(),
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  employeeId: true,
  firstName: true,
  lastName: true,
  positions: true,
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// Shifts table
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  type: text("type").notNull(),
  creditCardTips: real("credit_card_tips").notNull(),
  houseTips: real("house_tips").notNull(),
  cashTips: real("cash_tips").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShiftSchema = createInsertSchema(shifts).pick({
  date: true,
  type: true,
  creditCardTips: true,
  houseTips: true,
  cashTips: true,
});

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;

// Shift employees table
export const shiftEmployees = pgTable("shift_employees", {
  id: serial("id").primaryKey(),
  shiftId: integer("shift_id").notNull(),
  employeeId: integer("employee_id").notNull(),
  position: text("position").notNull(),
  pointValue: real("point_value").notNull(),
  clockIn: text("clock_in").notNull(),
  clockOut: text("clock_out").notNull(),
  hoursWorked: real("hours_worked").notNull(),
  points: real("points").notNull(),
  digitalTips: real("digital_tips").notNull(),
  cashTips: real("cash_tips").notNull(),
});

export const insertShiftEmployeeSchema = createInsertSchema(shiftEmployees).pick({
  shiftId: true,
  employeeId: true,
  position: true,
  pointValue: true,
  clockIn: true,
  clockOut: true,
  hoursWorked: true,
  points: true,
  digitalTips: true,
  cashTips: true,
});

export type ShiftEmployee = typeof shiftEmployees.$inferSelect;
export type InsertShiftEmployee = z.infer<typeof insertShiftEmployeeSchema>;

// Common types used throughout the application
export type RestaurantSetup = {
  restaurant: RestaurantConfig;
  shiftTypes: ShiftType[];
  positions: Position[];
};

export type ShiftEmployeeInput = {
  employeeId: number;
  position: string;
  pointValue: number;
  clockIn: string;
  clockOut: string;
  hoursWorked: number;
  points: number;
};

export type ShiftInput = {
  date: string;
  type: string;
  creditCardTips: number;
  houseTips: number;
  cashTips: number;
  employees: ShiftEmployeeInput[];
};

export type TipDistributionResult = {
  employeeId: number;
  name: string;
  position: string;
  hours: number;
  points: number;
  digitalTips: number;
  cashTips: number;
};

export type ShiftResult = {
  shift: Shift;
  results: TipDistributionResult[];
};
