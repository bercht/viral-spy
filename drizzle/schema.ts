import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Scraping jobs table
export const scrapings = mysqlTable("scrapings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  urls: text("urls").notNull(), // JSON array of Instagram URLs
  resultsLimit: int("resultsLimit").default(200).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "error"]).default("pending").notNull(),
  currentStep: text("currentStep"), // Current processing step
  progress: int("progress").default(0), // 0-100
  spreadsheetUrl: text("spreadsheetUrl"), // Google Sheets URL with results
  analysisUrl: text("analysisUrl"), // Google Sheets URL with analysis
  assistantId: text("assistantId"), // OpenAI Assistant ID
  assistantUrl: text("assistantUrl"), // OpenAI Assistant playground URL
  threadId: text("threadId"), // OpenAI Thread ID for chat
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Scraping = typeof scrapings.$inferSelect;
export type InsertScraping = typeof scrapings.$inferInsert;

// Chat messages table
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  scrapingId: int("scrapingId").notNull().references(() => scrapings.id),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;