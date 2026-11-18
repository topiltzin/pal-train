import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/lib/db/schema";

let cachedDb: ReturnType<typeof createDb> | undefined;

// The WebSocket pool, not the HTTP driver: only the pool runs transactions (password reset needs them).
function createDb(databaseUrl: string) {
  return drizzle({ client: new Pool({ connectionString: databaseUrl }), schema });
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
