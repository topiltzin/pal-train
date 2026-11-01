import { z } from "zod";

const AUTH0_SECRET_MIN_LENGTH = 32;

const envSchema = z.object({
  AUTH0_SECRET: z.string().min(AUTH0_SECRET_MIN_LENGTH),
  APP_BASE_URL: z.string().min(1),
  AUTH0_DOMAIN: z.string().min(1),
  AUTH0_CLIENT_ID: z.string().min(1),
  AUTH0_CLIENT_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (result.success) {
    return result.data;
  }
  const names = result.error.issues.map((issue) => String(issue.path[0])).join(", ");
  throw new Error(`Missing or invalid environment variables: ${names}`);
}

let cachedEnv: Env | undefined;

export function getEnv(): Env {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
