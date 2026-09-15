import sql from "mssql";

import { env } from "./env.js";

const databaseConfig: sql.config = {
  server: env.database.server,
  port: env.database.port,
  database: env.database.database,
  user: env.database.user,
  password: env.database.password,

  options: {
    encrypt: true,
    trustServerCertificate: true,
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export const getDatabasePool = async (): Promise<sql.ConnectionPool> => {
  if (!poolPromise) {
    poolPromise = sql.connect(databaseConfig).catch((error: unknown) => {
      poolPromise = null;
      throw error;
    });
  }

  return poolPromise;
};

export const closeDatabasePool = async (): Promise<void> => {
  if (!poolPromise) {
    return;
  }

  const pool = await poolPromise;

  poolPromise = null;

  await pool.close();
};
