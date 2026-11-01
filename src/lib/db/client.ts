import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

let cachedDb: ReturnType<typeof createDb> | undefined;

function createDb(databaseUrl: string) {
  return drizzle(neon(databaseUrl), { schema });
}

export function getDb() {
  if (!cachedDb) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("Missing environment variable: DATABASE_URL");
    }
    cachedDb = createDb(databaseUrl);
  }
  return cachedDb;
}
