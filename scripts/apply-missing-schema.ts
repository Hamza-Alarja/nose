import "dotenv/config";
import { createConnection, RowDataPacket } from "mysql2/promise";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required to run this script.");
  process.exit(1);
}

async function query<T = RowDataPacket[]>(sql: string, params: unknown[] = []) {
  return conn.query<T>(sql, params);
}

const conn = await createConnection(connectionString);

try {
  const [currentDbRows] = await query<RowDataPacket[]>(
    "SELECT DATABASE() AS db"
  );
  const currentDb = currentDbRows[0]?.db;
  if (!currentDb) {
    throw new Error("Unable to determine current database from connection.");
  }

  async function tableExists(tableName: string) {
    const [rows] = await query<RowDataPacket[]>(
      `SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
      [currentDb, tableName]
    );
    return Number(rows[0]?.count ?? 0) > 0;
  }

  async function columnExists(tableName: string, columnName: string) {
    const [rows] = await query<RowDataPacket[]>(
      `SELECT COUNT(*) AS count FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
      [currentDb, tableName, columnName]
    );
    return Number(rows[0]?.count ?? 0) > 0;
  }

  async function createStoreSettingsTable() {
    console.log("Creating missing table: store_settings");
    await query(`
      CREATE TABLE \`store_settings\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`store_name\` varchar(255) NOT NULL DEFAULT 'NOSE',
        \`announcement_en\` text NULL,
        \`announcement_ar\` text NULL,
        \`shipping_fee\` decimal(10,2) NOT NULL DEFAULT '25.00',
        \`free_shipping_enabled\` boolean NOT NULL DEFAULT false,
        \`free_shipping_threshold\` decimal(10,2) NOT NULL DEFAULT '200.00',
        \`currency\` varchar(3) NOT NULL DEFAULT 'AED',
        \`support_email\` varchar(320) NOT NULL DEFAULT '',
        \`phone_number\` varchar(64) NOT NULL DEFAULT '',
        \`whatsapp_number\` varchar(64) NOT NULL DEFAULT '',
        \`instagram_url\` varchar(255) NOT NULL DEFAULT '',
        \`facebook_url\` varchar(255) NOT NULL DEFAULT '',
        \`tiktok_url\` varchar(255) NOT NULL DEFAULT '',
        \`twitter_url\` varchar(255) NOT NULL DEFAULT '',
        \`store_address_en\` text NULL,
        \`store_address_ar\` text NULL,
        \`business_hours_en\` text NULL,
        \`business_hours_ar\` text NULL,
        \`logo_url\` text NULL,
        \`favicon_url\` text NULL,
        \`admin_login_logo_url\` text NULL,
        \`created_at\` timestamp NOT NULL,
        \`updated_at\` timestamp NOT NULL,
        CONSTRAINT \`store_settings_id\` PRIMARY KEY(\`id\`)
      )
    `);
  }

  async function addUserColumn(columnSql: string, columnName: string) {
    console.log(`Adding missing users column: ${columnName}`);
    await query(columnSql);
  }

  async function addOrderColumn(columnSql: string, columnName: string) {
    console.log(`Adding missing orders column: ${columnName}`);
    await query(columnSql);
  }

  const requiredUserColumns = [
    {
      name: "password_hash",
      sql: "ALTER TABLE `users` ADD COLUMN `password_hash` varchar(255) NULL",
    },
    {
      name: "first_name",
      sql: "ALTER TABLE `users` ADD COLUMN `first_name` varchar(120) NULL",
    },
    {
      name: "last_name",
      sql: "ALTER TABLE `users` ADD COLUMN `last_name` varchar(120) NULL",
    },
    {
      name: "phone",
      sql: "ALTER TABLE `users` ADD COLUMN `phone` varchar(32) NULL",
    },
    {
      name: "is_active",
      sql: "ALTER TABLE `users` ADD COLUMN `is_active` boolean NOT NULL DEFAULT true",
    },
    {
      name: "last_login_at",
      sql: "ALTER TABLE `users` ADD COLUMN `last_login_at` timestamp NULL",
    },
  ];

  const requiredOrdersColumns = [
    {
      name: "subtotal_amount",
      sql: "ALTER TABLE `orders` ADD COLUMN `subtotal_amount` decimal(10,2) NOT NULL DEFAULT '0.00'",
    },
    {
      name: "shipping_amount",
      sql: "ALTER TABLE `orders` ADD COLUMN `shipping_amount` decimal(10,2) NOT NULL DEFAULT '0.00'",
    },
    {
      name: "discount_amount",
      sql: "ALTER TABLE `orders` ADD COLUMN `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00'",
    },
    {
      name: "tax_amount",
      sql: "ALTER TABLE `orders` ADD COLUMN `tax_amount` decimal(10,2) NOT NULL DEFAULT '0.00'",
    },
    {
      name: "currency",
      sql: "ALTER TABLE `orders` ADD COLUMN `currency` varchar(3) NOT NULL DEFAULT 'AED'",
    },
    {
      name: "coupon_code",
      sql: "ALTER TABLE `orders` ADD COLUMN `coupon_code` varchar(64) NULL",
    },
    {
      name: "coupon_type",
      sql: "ALTER TABLE `orders` ADD COLUMN `coupon_type` varchar(16) NULL",
    },
    {
      name: "coupon_value",
      sql: "ALTER TABLE `orders` ADD COLUMN `coupon_value` decimal(10,2) NULL",
    },
    {
      name: "user_id",
      sql: "ALTER TABLE `orders` ADD COLUMN `user_id` int NULL",
    },
    {
      name: "payment_link_id",
      sql: "ALTER TABLE `orders` ADD COLUMN `payment_link_id` varchar(255) NULL",
    },
    {
      name: "payment_link_url",
      sql: "ALTER TABLE `orders` ADD COLUMN `payment_link_url` text NULL",
    },
  ];

  const missingActions: Array<() => Promise<void>> = [];

  const hasUsersTable = await tableExists("users");
  if (!hasUsersTable) {
    throw new Error(
      "The users table is missing. This script only repairs missing user columns and store_settings schema."
    );
  }

  for (const column of requiredUserColumns) {
    if (await columnExists("users", column.name)) {
      console.log(`${column.name} already exists`);
      continue;
    }

    missingActions.push(async () => addUserColumn(column.sql, column.name));
  }

  const hasOrdersTable = await tableExists("orders");
  if (!hasOrdersTable) {
    throw new Error(
      "The orders table is missing. This script only repairs missing orders columns and existing store_settings/user schema."
    );
  }

  for (const column of requiredOrdersColumns) {
    if (await columnExists("orders", column.name)) {
      console.log(`${column.name} already exists`);
      continue;
    }

    missingActions.push(async () => addOrderColumn(column.sql, column.name));
  }

  const hasStoreSettings = await tableExists("store_settings");
  if (!hasStoreSettings) {
    missingActions.push(createStoreSettingsTable);
  }

  if (missingActions.length === 0) {
    console.log(
      "No schema changes required. Database schema already contains the expected objects."
    );
    process.exit(0);
  }

  for (const action of missingActions) {
    await action();
  }

  console.log("Schema repair completed successfully.");
  process.exit(0);
} catch (error) {
  console.error(
    "Schema repair failed:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
} finally {
  await conn.end();
}
