# Security Review: Exercise Demo Shorts

**Feature**: 005-exercise-shorts-videos | **Date**: 2026-11-04 | **Required by**: constitution, Quality Gates (database queries, external embed, user input at the API boundary)

**Result**: PASS, with the residual risks listed at the end. No CRITICAL or HIGH findings.

## Checklist (from quickstart.md section 6)

| Check | Result | Evidence |
|-------|--------|----------|
| Every query uses Drizzle parameters; no string-built SQL | PASS | `src/features/demos/drizzle-demo-link-repository.ts` uses `eq`, `and`, `inArray`, and `like` with bound values. The only inline SQL is the table's CHECK constraints in `src/lib/db/schema.ts`, which contain constants only. |
| The embed host is fixed to youtube-nocookie.com | PASS | `EMBED_ORIGIN` in `src/features/demos/video-id.ts` is a constant. `buildEmbedUrl` is the only builder of the embed URL. |
| Only validated 11-character ids reach the URL | PASS | Stored values are checked by a database CHECK constraint (`^[A-Za-z0-9_-]{11}$`) and by `validateNewDemoLink` before any write. The import rejects anything else (`tests/unit/demos/import-rows.test.ts`). |
| The API returns only videoId and title | PASS | `toDemoView` returns `{ videoId, title }` only. The `channel`, `addedAt`, and internal `id` fields are never sent to the page (`tests/unit/demos/demo-link.test.ts`). |
| The import reads only the reviewed CSV and does not accept URLs | PASS | `scripts/import-exercise-demos.ts` takes a file path. The CSV parser keeps only `accept` rows, validates each one, and reports the rest (`tests/unit/demos/import-rows.test.ts`). |
| The demo lookup runs only for signed-in requests | PASS | `handlePostSessionPlan` calls `requireUser` before anything else (`src/features/sessions/handle-session-plan.ts`). |

## Additional checks

| Area | Result | Evidence |
|------|--------|----------|
| Cross-frame messages | PASS | The window accepts a message only when its origin is the embed origin and its source is the frame's own window (`src/components/demo-dialog.tsx`). The `listening` message is sent to the fixed embed origin, never `*`. |
| Output encoding | PASS | Titles and exercise names are rendered as React text. `dangerouslySetInnerHTML` is not used anywhere in `src`. |
| Frame attributes | PASS | `referrerPolicy="strict-origin-when-cross-origin"`; the `allow` list is limited to autoplay, encrypted media, and picture-in-picture. |
| Privacy | PASS | The privacy-enhanced host is used. The frame is created only when the user opens the window. |
| Failure handling | PASS | A database failure during the plan lookup is logged with the route label, and the plan still returns with `demo: null` (`tests/integration/api/session-plan.test.ts`). |

## Residual risks (accepted)

1. **Third-party script on open.** Opening a demo loads YouTube's player, which runs YouTube's own script inside the frame. This is inherent to showing a YouTube video in the page. It is limited to the user's explicit tap.
2. **Frame not sandboxed.** The frame has no `sandbox` attribute, because the YouTube player needs same-origin behaviour to play. Restricting it would break playback. Accepted.
3. **Stored values are trusted after validation.** A row edited directly in the database bypasses the import's checks, but the database CHECK constraint still enforces the id format. A title edited directly is rendered as text, so it cannot inject markup.
4. **No rate limit on the demo lookup.** The lookup adds one indexed query to a plan request that already runs under the existing plan limits. No separate limit added.

No external penetration test was run. This review is a code and configuration review against the checklist above.
