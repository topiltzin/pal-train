import { createAuthClient } from "better-auth/react";

/**
 * The browser client for sign-in, sign-up, and sign-out. It calls the same origin under
 * /api/auth, so it needs no configuration and never sees the server secret.
 */
export const authClient = createAuthClient();
