import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(3000),

  DB_SERVER: z.string().min(1, "DB_SERVER is required"),

  DB_PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(1433),

  DB_DATABASE: z.string().min(1, "DB_DATABASE is required"),

  DB_USER: z.string().min(1, "DB_USER is required"),

  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");

  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }

  throw new Error("Environment configuration is invalid.");
}

export const env = {
  nodeEnv: result.data.NODE_ENV,
  port: result.data.PORT,

  database: {
    server: result.data.DB_SERVER,
    port: result.data.DB_PORT,
    database: result.data.DB_DATABASE,
    user: result.data.DB_USER,
    password: result.data.DB_PASSWORD,
  },
} as const;