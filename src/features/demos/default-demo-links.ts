import { withLinkCache } from "@/features/demos/cached-demo-link-repository";
import type { DemoLinkRepository } from "@/features/demos/demo-link-repository";
import { createDrizzleDemoLinkRepository } from "@/features/demos/drizzle-demo-link-repository";

/** The demo lookup the app uses in production: the database, behind a short-lived cache. */
export const defaultDemoLinks: DemoLinkRepository = withLinkCache(
  createDrizzleDemoLinkRepository(),
);
