import {
  mysqlTable,
  mysqlSchema,
  AnyMySqlColumn,
  int,
  varchar,
  timestamp,
  text,
  decimal,
  mysqlEnum,
  json,
  boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().notNull().primaryKey(),
  email: varchar({ length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  preferredLanguage: varchar("preferred_language", { length: 5 })
    .default("en")
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at", { mode: "string" }),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const discountCodes = mysqlTable("discount_codes", {
  id: int("id").autoincrement().notNull().primaryKey(),
  code: varchar({ length: 64 }).notNull().unique(),
  type: mysqlEnum(["percentage", "fixed"]).notNull(),
  value: decimal({ precision: 10, scale: 2 }).notNull(),
  minimumOrderAmount: decimal("minimum_order_amount", {
    precision: 10,
    scale: 2,
  })
    .default("0.00")
    .notNull(),
  maximumDiscountAmount: decimal("maximum_discount_amount", {
    precision: 10,
    scale: 2,
  }),
  usageLimit: int("usage_limit"),
  usedCount: int("used_count").default(0).notNull(),
  startsAt: timestamp("starts_at", { mode: "string" }),
  expiresAt: timestamp("expires_at", { mode: "string" }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().notNull().primaryKey(),
  orderId: int("order_id").notNull(),
  productId: int("product_id").notNull(),
  productNameAr: varchar("product_name_ar", { length: 255 }).notNull(),
  productNameEn: varchar("product_name_en", { length: 255 }).notNull(),
  productImage: text("product_image"),
  variant: varchar({ length: 64 }),
  quantity: int().notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().notNull().primaryKey(),
  orderNumber: varchar("order_number", { length: 32 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
  customerEmail: varchar("customer_email", { length: 320 }),
  shippingAddress: text("shipping_address").notNull(),
  city: varchar({ length: 128 }),
  country: varchar({ length: 64 }).default("AE"),
  status: mysqlEnum([
    "pending",
    "processing",
    "shipped",
    "completed",
    "cancelled",
  ])
    .default("pending")
    .notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  subtotalAmount: decimal("subtotal_amount", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  currency: varchar({ length: 3 }).default("AED").notNull(),
  couponCode: varchar("coupon_code", { length: 64 }),
  couponType: varchar("coupon_type", { length: 16 }),
  couponValue: decimal("coupon_value", { precision: 10, scale: 2 }),
  paymentStatus: mysqlEnum("payment_status", ["unpaid", "paid", "refunded"])
    .default("unpaid")
    .notNull(),
  paymentLinkId: varchar("payment_link_id", { length: 255 }),
  paymentLinkUrl: text("payment_link_url"),
  notes: text(),
  userId: int("user_id"),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().notNull().primaryKey(),
  sku: varchar({ length: 64 }).notNull().unique(),
  nameAr: varchar("name_ar", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  scentNotesAr: text("scent_notes_ar"),
  scentNotesEn: text("scent_notes_en"),
  category: varchar({ length: 64 }).default("perfume"),
  price: decimal({ precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  stockQuantity: int("stock_quantity").default(0).notNull(),
  images: json("images").$type<string[]>(),
  variants: json("variants").$type<
    {
      size: string;
      price: number;
      stock: number;
    }[]
  >(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isNew: boolean("is_new").default(false).notNull(),
  isBestseller: boolean("is_bestseller").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const users = mysqlTable("users", {
  id: int("id").autoincrement().notNull().primaryKey(),
  openId: varchar({ length: 64 }).notNull().unique(),
  name: text(),
  email: varchar({ length: 320 }),
  loginMethod: varchar({ length: 64 }),
  role: mysqlEnum(["user", "admin"]).default("user").notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name", { length: 120 }),
  lastName: varchar("last_name", { length: 120 }),
  phone: varchar({ length: 32 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  lastSignedIn: timestamp({ mode: "string" }).notNull(),
  lastLoginAt: timestamp("last_login_at", { mode: "string" }),
});

export const storeSettings = mysqlTable("store_settings", {
  id: int("id").autoincrement().notNull().primaryKey(),
  storeName: varchar("store_name", { length: 255 }).default("NOSE").notNull(),
  announcementEn: text("announcement_en").default(""),
  announcementAr: text("announcement_ar").default(""),
  shippingFee: decimal("shipping_fee", { precision: 10, scale: 2 })
    .default("25.00")
    .notNull(),
  freeShippingEnabled: boolean("free_shipping_enabled")
    .default(false)
    .notNull(),
  freeShippingThreshold: decimal("free_shipping_threshold", {
    precision: 10,
    scale: 2,
  })
    .default("200.00")
    .notNull(),
  currency: varchar({ length: 3 }).default("AED").notNull(),
  supportEmail: varchar("support_email", { length: 320 }).default(""),
  phoneNumber: varchar("phone_number", { length: 64 }).default(""),
  whatsappNumber: varchar("whatsapp_number", { length: 64 }).default(""),
  instagramUrl: varchar("instagram_url", { length: 255 }).default(""),
  facebookUrl: varchar("facebook_url", { length: 255 }).default(""),
  tiktokUrl: varchar("tiktok_url", { length: 255 }).default(""),
  twitterUrl: varchar("twitter_url", { length: 255 }).default(""),
  storeAddressEn: text("store_address_en").default(""),
  storeAddressAr: text("store_address_ar").default(""),
  businessHoursEn: text("business_hours_en").default(""),
  businessHoursAr: text("business_hours_ar").default(""),
  logoUrl: text("logo_url").default(""),
  faviconUrl: text("favicon_url").default(""),
  adminLoginLogoUrl: text("admin_login_logo_url").default(""),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InsertProduct = typeof products.$inferInsert;
export type InsertOrder = typeof orders.$inferInsert;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type StoreSettings = typeof storeSettings.$inferSelect;
export type InsertStoreSettings = typeof storeSettings.$inferInsert;
