# Data Model: Password Reset for Users

## Existing tables used (Better Auth, unchanged)

| Table | Used for | Notes |
|-------|----------|-------|
| `user` | The account. Looked up by email. | `email` is unique (`user_email_unique`). |
| `account` | The password credential (`provider_id` = credential). | The password hash is written here on reset. |
| `session` | Signed-in devices. | Revoked for the account on a successful reset (`revokeSessionsOnPasswordReset`). |
| `verification` | Reset tokens. | Better Auth writes one row per reset: `identifier` = `reset-password:<token>`, `value` = user id, `expires_at` = now + 60 minutes. Rows for an account are deleted when a newer reset is requested (Decision 2). |

## New table: `password_reset_request`

One row per accepted reset request. Used only to enforce the per-account limit (spec FR-010).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | serial / text primary key | required | Identifier. |
| `user_id` | text | required, references `user.id` on delete cascade | The account the request is for. |
| `requested_at` | timestamp with time zone | required, default now() | When the request was accepted. |

Indexes:
- `(user_id, requested_at)`, so the 60-minute count for an account is one index range.

Validation rules:
- A row is written only when a reset email is actually sent (requests refused by the limit or for unknown addresses write nothing).
- Rows older than 24 hours may be deleted by any cleanup job; they are not needed for the 60-minute limit. Cleanup is out of scope for this feature.

## Configuration values (not stored)

| Name | Value | Source |
|------|-------|--------|
| Reset token lifetime | 3600 seconds | Spec FR-005 |
| Requests per account per window | 5 | Spec FR-010 |
| Limit window | 60 minutes, rolling | Spec FR-010 |
| Minimum password length | Same as sign-up | Spec FR-007; Better Auth default of 8, confirmed against sign-up before implementation |
| Maximum password length | 128 | Better Auth default |

## State transitions for one reset link

```
requested ──(new request for same account)──▶ replaced (row deleted, link stops working)
requested ──(60 minutes pass)──────────────▶ expired (row removed by Better Auth, link fails)
requested ──(opened and new password saved)─▶ used (row removed; sessions revoked; link fails)
requested ──(failed save, Decision 5)──────▶ still requested (transaction rolled back; link usable)
```
