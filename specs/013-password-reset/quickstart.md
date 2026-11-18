# Quickstart: Password Reset for Users

How to check the feature works end to end once built. See [data-model.md](data-model.md) and [contracts/password-reset-interfaces.md](contracts/password-reset-interfaces.md) for the details.

## Prerequisites

- Dependencies installed (`npm install`) and `.env.local` set up. The new variables are `RESEND_API_KEY` and `PASSWORD_RESET_FROM`; the app refuses to start without them when password reset is enabled.
- The database migration for `password_reset_request` applied (`npm run db:migrate`).
- A test account with a mailbox you can read. Set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` for the signed-in tests.

## 1. Automated checks

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
```

Expected: all pass. New unit tests cover the limit rule, the email content, and the environment check. Integration tests cover the reset flow against a fake sender (see step 4).

## 2. Happy path (manual)

1. Open `/sign-in`, choose "Forgot password?".
2. Enter the test account's email and submit. Expected: the confirmation message.
3. Open the email. Expected: one message, no password in it, a link valid for 60 minutes.
4. Open the link. Expected: the new-password form.
5. Enter a new password that meets the sign-up rules. Expected: "Your password has been changed."
6. Sign in with the old password. Expected: refused. Sign in with the new password. Expected: success.

## 3. Failure cases (manual)

- Open the same link twice. Expected: second time shows "This link is no longer valid."
- Request two resets, then open the first link. Expected: "This link is no longer valid." The second link works.
- Enter an address with no account. Expected: the same confirmation as step 2, and no email arrives.
- Request six resets for one account within an hour. Expected: the sixth shows the same confirmation and no sixth email arrives.
- Sign in on a second browser, then complete a reset in the first. Expected: the second browser is signed out on its next page load.

## 4. Automated end-to-end check

```bash
npm run test:e2e -- tests/e2e/password-reset.spec.ts
```

The spec uses a fake sender in test mode, so it reads the reset link without a real mailbox. Without credentials it skips with the stated reason.

## 5. Layout and access

- Phone width (about 390px): no horizontal scrolling on any reset page.
- Keyboard only: every control reachable; an invalid email shows its error under the field and is announced.

## Troubleshooting

- App fails to start with a message naming `RESEND_API_KEY`: set it in `.env.local`, or check the Vercel project environment.
- Emails do not arrive: check the provider's dashboard for the sender address and that `PASSWORD_RESET_FROM` is verified there.
- A reset fails after a valid password was entered: check the database driver setting (Decision 5); the transaction must be enabled.
