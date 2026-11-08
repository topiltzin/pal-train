# Quickstart: Verify the OpenAI MCP Connector

**Feature**: 008-openai-mcp-login | **Date**: 2026-11-07

This is a run-and-verify guide. For the design, see [plan.md](./plan.md). For the endpoints and tools, see [contracts/http-endpoints.md](./contracts/http-endpoints.md) and [contracts/mcp-tools.md](./contracts/mcp-tools.md).

## Prerequisites

- The app's existing setup: `.env.local` with the Auth0 and database variables (see `.env.example`).
- Access to the Auth0 dashboard for the Paltrain tenant, with permission to create an API and an application.
- A ChatGPT account that can add custom connectors.
- The Neon database migration for this feature applied (`npm run db:migrate`).

## 1. Configure Auth0 (manual, in the Auth0 dashboard)

1. Create an **API** whose identifier (audience) is the resource URL: `https://<paltrain-host>/mcp`. Use RS256 signing. Set the access-token lifetime to 3600 seconds or less (spec FR-005).
2. Define the read-only scopes listed in the metadata route, for example `plans:read`.
3. Enable the client-registration method the research §2 spike confirms: Client ID Metadata Documents (preferred) or Dynamic Client Registration.
4. Record here whether the tenant emits RFC 9207 `iss` in authorization responses: `__________` (research §3).
5. Do not make the Auth0 consent screen the only consent step until the research §7 spike is resolved.

## 2. Configure the app

No new secrets are needed. The resource identifier is derived from `APP_BASE_URL` and the Auth0 domain already in `.env.local`. Confirm:

```text
APP_BASE_URL=https://<paltrain-host>
AUTH0_DOMAIN=<tenant>.auth0.com
```

## 3. Run the tests

```text
npm test                 # unit and integration, including tests/unit/mcp and tests/integration/mcp
npx playwright test tests/e2e/mcp-connections.spec.ts
npm run typecheck
npm run lint
```

Integration tests sign test tokens with a local key, so they do not contact Auth0.

## 4. Manual checks

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | `curl -i https://<host>/mcp` with no token | `401` with `WWW-Authenticate` pointing at the metadata URL. |
| 2 | `curl https://<host>/.well-known/oauth-protected-resource/mcp` | JSON with `resource`, `authorization_servers`, and `scopes_supported`. |
| 3 | Add Paltrain as a connector in ChatGPT, using the redirect URI it shows | ChatGPT opens Paltrain's sign-in through Auth0. |
| 4 | Sign in and approve | ChatGPT shows the connector as connected. A connection row appears in `/connections`. |
| 5 | Ask ChatGPT for a 30-minute legs session | `plan_session` is called and the plan matches the app's plan for the same inputs. |
| 6 | Disconnect in `/connections`, then ask ChatGPT again | The request is refused (`connection_inactive`) within one minute. |
| 7 | Run more than 60 requests in one minute as one user | `429` with `Retry-After`. |
| 8 | Inspect audit entries | Each event has a reason code and no token, email, or mood value. |

## 5. Before merge

- Security review of auth, token handling, and audit logging (constitution gate).
- Connector description and policy text reviewed against the OpenAI connector requirements (spec FR-014, SC-007).
- Pinned versions: `@modelcontextprotocol/server@2.4.0`, `jose@6.2.15` (exact, installed with --save-exact).
