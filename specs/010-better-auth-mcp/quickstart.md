# Quickstart: validate the Better Auth replacement

**Feature**: 010-better-auth-mcp | **Contract**: [contracts/connector-interface.md](contracts/connector-interface.md) | **Data model**: [data-model.md](data-model.md)

Run these checks in order. Each step lists what must be true before the next one starts.

## Prerequisites

- A Postgres database reachable from where the checks run (Neon). Integration tests fail with connection timeouts if it is not reachable.
- Environment values in `.env.local` for development, and in Vercel for a preview deployment:
  - `BETTER_AUTH_SECRET` (32 or more random characters)
  - `BETTER_AUTH_URL` (the base URL, `https://www.pal-buddy.eu` or `http://localhost:3000`)
  - `DATABASE_URL` (unchanged)
  - The Auth0 variables are removed.
- The packages `better-auth`, `@better-auth/mcp`, and `@better-auth/cimd` are installed at the versions chosen during implementation.

## 1. Schema is generated and migrated

```bash
npx @better-auth/cli generate --output src/lib/db/auth-schema.ts
npx drizzle-kit generate
npx drizzle-kit migrate
```

Expected: the tables from [data-model.md](data-model.md) exist (`user`, `session`, `account`, `verification`, `jwks`, and the OAuth plugin tables). The `users` table is unchanged.

## 2. Application builds and tests pass

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass. `npm run build` must list the `/mcp`, `/.well-known/oauth-protected-resource/mcp`, and `/api/auth/[...all]` routes.

## 3. Web sign-in works

1. Open `/sign-in`, register a test account with email and password.
2. Open a protected page (`/library`). Expected: it loads.
3. Sign out. Expected: a protected page redirects to `/sign-in`.
4. Sign in again. Expected: the same user record is used (no duplicate row in `users`).

## 4. Discovery documents

```bash
curl -s https://www.pal-buddy.eu/.well-known/oauth-protected-resource/mcp
curl -s https://www.pal-buddy.eu/api/auth/.well-known/oauth-authorization-server
```

Expected:
- The first returns `resource` = `https://www.pal-buddy.eu/mcp` and `authorization_servers` = the Better Auth issuer.
- The second lists `registration_endpoint`, `code_challenge_methods_supported` containing `S256`, and the authorization and token endpoints.

If the discovery path differs, record the real path here. Research open item 2 depends on it.

## 5. Unauthenticated MCP request is challenged

```bash
curl -s -i -X POST https://www.pal-buddy.eu/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

Expected: `401`, with `WWW-Authenticate` containing `resource_metadata`. The body contains no personal data.

## 6. Token contract test (the check that failed with Auth0)

This is the test that must pass before cutover. It uses a freshly registered client, the same way ChatGPT does.

1. Register a client:
   ```bash
   curl -s -X POST https://www.pal-buddy.eu/api/auth/oauth2/register -H 'content-type: application/json' -d '{"redirect_uris":["http://127.0.0.1:55105/callback"],"token_endpoint_auth_method":"none","grant_types":["authorization_code","refresh_token"],"response_types":["code"],"scope":"plans:read library:read"}'
   ```
   Expected: `201` with a `client_id`.
2. Start authorization with PKCE and the resource indicator, in a browser:
   `https://www.pal-buddy.eu/api/auth/oauth2/authorize?response_type=code&client_id=<id>&redirect_uri=http%3A%2F%2F127.0.0.1%3A55105%2Fcallback&scope=plans%3Aread+library%3Aread+offline_access&code_challenge=<S256 challenge>&code_challenge_method=S256&resource=https%3A%2F%2Fwww.pal-buddy.eu%2Fmcp`
   Expected: the Pal Buddy sign-in page, then the consent page. No "Oops" page and no 400.
3. Approve consent. Exchange the code at `/api/auth/oauth2/token` with the PKCE verifier.
   Expected: an access token.
4. Decode the access token payload (not the signature). Expected:
   - `aud` = `https://www.pal-buddy.eu/mcp`
   - `iss` = the Better Auth issuer
   - `scope` includes `plans:read`
   - the client identifier is present as `azp` or `client_id` (record which one; the connector reads `azp`)
5. Call the MCP endpoint with the token:
   ```bash
   curl -s -X POST https://www.pal-buddy.eu/mcp -H "authorization: Bearer <token>" -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
   ```
   Expected: `200` with the three tools.

If step 2 shows an error page, read the server log for the Better Auth error before changing any setting. Do not change the audience or the scopes to work around it.

## 7. Wrong audience is refused

Repeat step 6 with a token issued for a different resource (for example, omit `resource` or use `https://example.com/mcp`). Expected: `401`, and no tool output.

## 8. ChatGPT connection

1. In ChatGPT, add the pal-buddy connector with dynamic client registration.
2. Sign in on the Pal Buddy page, approve consent.
3. Ask for a 30-minute legs workout. Expected: a plan with exercise names and minutes.

## 9. Disconnect ends access

1. In Pal Buddy, open the connections page and disconnect ChatGPT.
2. Within one minute, repeat a ChatGPT request. Expected: refused (`connection_inactive` or a 401), with no plan returned.

## 10. Auth0 is gone

```bash
grep -rn "auth0\|AUTH0" src tests || echo "no Auth0 references"
```

Expected: `no Auth0 references`, apart from the removal notes in the spec.

## Security gate (FR-019)

Before step 8 is run with real users, the security review must be complete with no open CRITICAL or HIGH findings. Record the review result in the pull request.
