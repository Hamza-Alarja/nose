import "dotenv/config";
import { createConnection, RowDataPacket } from "mysql2/promise";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required to run this script.");
  process.exit(1);
}

async function query<T = RowDataPacket[]>(
  conn: ReturnType<typeof createConnection> extends Promise<infer U>
    ? U
    : never,
  sql: string,
  params: unknown[] = []
) {
  return conn.query<T>(sql, params);
}

const conn = await createConnection(connectionString);

try {
  const [dbRows] = await query<RowDataPacket[]>(
    conn,
    "SELECT DATABASE() AS db"
  );
  const currentDatabase = dbRows[0]?.db ?? null;
  console.log(JSON.stringify({ currentDatabase }, null, 2));

  const [tableRows] = await query<RowDataPacket[]>(conn, "SHOW TABLES");
  const tableNames = tableRows.map(
    row => Object.values(row)[0]?.toString() ?? ""
  );

  if (tableNames.includes("discount_codes")) {
    console.log("discount_codes already exists");
    process.exit(0);
  }

  const createDiscountCodesTableSql = `CREATE TABLE \`discount_codes\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`code\` varchar(64) NOT NULL,
  \`type\` enum('percentage','fixed') NOT NULL,
  \`value\` decimal(10,2) NOT NULL,
  \`minimum_order_amount\` decimal(10,2) NOT NULL DEFAULT '0.00',
  \`maximum_discount_amount\` decimal(10,2),
  \`usage_limit\` int,
  \`used_count\` int NOT NULL DEFAULT 0,
  \`starts_at\` timestamp,
  \`expires_at\` timestamp,
  \`is_active\` boolean NOT NULL DEFAULT true,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`discount_codes_id\` PRIMARY KEY(\`id\`),
  CONSTRAINT \`discount_codes_code_unique\` UNIQUE(\`code\`)
);`;

  console.log("Creating discount_codes table...");
  await query(conn, createDiscountCodesTableSql);
  console.log("discount_codes table created");

  const requiredOrderColumns = [
    {
      name: "coupon_type",
      sql: "ALTER TABLE `orders` ADD COLUMN `coupon_type` varchar(16)",
    },
    {
      name: "coupon_value",
      sql: "ALTER TABLE `orders` ADD COLUMN `coupon_value` decimal(10,2)",
    },
  ];

  if (!tableNames.includes("orders")) {
    console.log("orders table does not exist; coupon columns were not added.");
    process.exit(0);
  }

  async function columnExists(tableName: string, columnName: string) {
    const [rows] = await query<RowDataPacket[]>(
      conn,
      `SELECT COUNT(*) AS count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
      [tableName, columnName]
    );
    return Number(rows[0]?.count ?? 0) > 0;
  }

  for (const column of requiredOrderColumns) {
    if (await columnExists("orders", column.name)) {
      console.log(`Order column ${column.name} already exists`);
      continue;
    }
    console.log(`Adding missing order column: ${column.name}`);
    await query(conn, column.sql);
  }

  console.log("Script completed successfully.");
} catch (error) {
  console.error(
    "Script failed:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
} finally {
  await conn.end();
}
