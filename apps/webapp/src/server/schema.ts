import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

export const approvalRequestStatusEnum = pgEnum("approval_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: integer("owner_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const packageMembers = pgTable(
  "package_members",
  {
    id: serial("id").primaryKey(),
    packageId: integer("package_id")
      .references(() => packages.id)
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      packageUserUnique: uniqueIndex("package_user_unique").on(
        table.packageId,
        table.userId,
      ),
    };
  },
);

export const approvalGroups = pgTable("approval_groups", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id")
    .references(() => packages.id)
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const approvalGroupMembers = pgTable(
  "approval_group_members",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .references(() => approvalGroups.id)
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      groupUserUnique: uniqueIndex("group_user_unique").on(
        table.groupId,
        table.userId,
      ),
    };
  },
);

export const approvalRequests = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id")
    .references(() => packages.id)
    .notNull(),
  title: text("title").notNull(),
  status: approvalRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const approvals = pgTable(
  "approvals",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id")
      .references(() => approvalRequests.id)
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      requestUserUnique: uniqueIndex("request_user_unique").on(
        table.requestId,
        table.userId,
      ),
    };
  },
);
