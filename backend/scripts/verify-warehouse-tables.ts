import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

async function verifyTables() {
  const pool = await sql.connect({
    server: process.env.DB_SERVER!,
    port: Number(process.env.DB_PORT!),
    database: process.env.DB_DATABASE!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  });

  try {
    const result = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME IN (
        'PickingTasks',
        'PickingTaskItems',
        'PackingTasks',
        'Packages',
        'Deliveries',
        'DeliveryTracking',
        'DeliveryAttempts'
      )
      ORDER BY TABLE_NAME;
    `);

    console.table(result.recordset);
  } finally {
    await pool.close();
  }
}

verifyTables().catch((error) => {
  console.error("Table verification failed:");
  console.error(error);
  process.exit(1);
});
