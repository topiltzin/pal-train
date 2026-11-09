import { z } from "zod";

const BETTER_AUTH_SECRET_MIN_LENGTH = 32;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** Plain HTTP is allowed only for local development, never for a public host. */
function isAllowedAuthUrl(value: string): boolean {
  const url = new URL(value);
  return url.protocol === "https:" || (url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname));
}

const envSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(BETTER_AUTH_SECRET_MIN_LENGTH),
  BETTER_AUTH_URL: z.string().refine(isAllowedAuthUrl, {
    message: "BETTER_AUTH_URL must use HTTPS unless it points at localhost",
  }),
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
