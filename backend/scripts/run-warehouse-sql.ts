import fs from "fs";
import path from "path";
import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config: sql.config = {
  server: process.env.DB_SERVER!,
  port: Number(process.env.DB_PORT!),
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const files = [
  "sql/2026-09-17/001_picking.sql",
  "sql/2026-09-17/002_packing.sql",
  "sql/2026-09-17/003_delivery.sql",
];

async function run() {
  let pool: sql.ConnectionPool | undefined;

  try {
    console.log("Connecting to SQL Server...");
    pool = await sql.connect(config);
    console.log("Connected successfully.\n");

    for (const file of files) {
      const filePath = path.resolve(file);

      console.log(`Executing: ${file}`);

      const script = fs.readFileSync(filePath, "utf8");

      const batches = script
        .split(/^\s*GO\s*$/gim)
        .map((batch) => batch.trim())
        .filter(Boolean);

      for (const batch of batches) {
        await pool.request().batch(batch);
      }

      console.log(`✓ Completed: ${file}\n`);
    }

    console.log("=================================");
    console.log("All SQL files executed successfully.");
    console.log("=================================");
  } catch (error) {
    console.error("\nSQL execution failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

run();
