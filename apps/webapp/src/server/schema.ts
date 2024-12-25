import type { AdapterAccount } from "next-auth/adapters";
import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  uniqueIndex,
  pgEnum,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

export const approvalRequestStatusEnum = pgEnum("approval_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const usersTable = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accountsTable = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessionsTable = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokensTable = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

export const devicesTable = pgTable(
  "devices",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .references(() => usersTable.id)
      .notNull(),
    name: text("name").notNull(),
    fcmToken: text("fcm_token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    deviceUserUnique: uniqueIndex("device_user_unique").on(
      table.userId,
      table.fcmToken,
    ),
    userNameUnique: uniqueIndex("user_name_unique").on(
      table.userId,
      table.name,
    ),
  }),
);

export const packagesTable = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .references(() => usersTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const packageMembersTable = pgTable(
  "package_members",
  {
    id: serial("id").primaryKey(),
    packageId: integer("package_id")
      .references(() => packagesTable.id)
      .notNull(),
    userId: text("user_id")
      .references(() => usersTable.id)
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

export const approvalGroupsTable = pgTable("approval_groups", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id")
    .references(() => packagesTable.id)
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const approvalGroupMembersTable = pgTable(
  "approval_group_members",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .references(() => approvalGroupsTable.id)
      .notNull(),
    userId: text("user_id")
      .references(() => usersTable.id)
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

export const approvalRequestsTable = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id")
    .references(() => packagesTable.id)
    .notNull(),
  title: text("title").notNull(),
  status: approvalRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const approvalsTable = pgTable(
  "approvals",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id")
      .references(() => approvalRequestsTable.id)
      .notNull(),
    userId: text("user_id")
      .references(() => usersTable.id)
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
