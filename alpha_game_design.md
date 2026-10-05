# Alpha: account model and security expectations

## What "actual game with public sign-in/sign-up and profile" means here
- Public players should be able to sign up and sign in with their own accounts.
- Each signed-in player gets a profile/progress space tied to the game side, not the company site.
- Public player flows should be self-service (sign up, sign in, basic profile).

## Dual staff accounts
- Staff operate on two distinct identities:
  - A website/company account for the portal, admin, careers, announcements, and internal team tools.
  - A separate in-game account for the actual game experience.
- These should not be the same login surface. Mixing them increases risk and also confuses permissions.

## Password/security posture for website accounts
- Website/company staff accounts should use passwords (or equivalent strong credentials), not magic phrases, game tokens, or AI-flavored placeholders like `company`, `admin`, `staff`, `team`, `openworlds`, `password`, `staff1`, `company1` and similar.
- Credential wording should avoid company-themed or context-flavored phrasing for logins/passwords.
- Security should favor:
  - Strong passwords or passkeys where feasible.
  - No shared or guessable default phrases.
  - Login identifiers that are not obviously derived from "company" or "staff" branding.

## Style constraints for auth/identity text
- Avoid AI-sounding marketing phrasing in login, sign-up, or account-mgmt flows.
- Keep the language plain and functional: sign in, sign up, profile, security, account, etc.

## Current implementation reality
- The current codebase has no separate in-game account model.
- Public player sign-up currently is not an open public path in auth; staff sign-in is invitation/approval-gated.
- This file is a design reference for the next steps, not something that changes the running app by itself.
