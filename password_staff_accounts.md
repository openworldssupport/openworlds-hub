# Passwords for the website/company staff accounts

## Current behavior
- Company staff sign in uses email OTP only.
- There is no password-based login path for the website/company portal yet.

## Requested behavior
- Website/company staff accounts should have passwords.
- Passwords should be used for website account security.
- Login identifiers and credentials should avoid company-flavored or AI-flavored phrasing such as `company`, `admin`, `staff`, `team`, `openworlds`, `password`, `staff1`, `company1`, and similar.

## Security notes
- Do not use easily guessable default passwords.
- Do not derive passwords from the company name, product name, or role names.
- If password storage is added, use a dedicated credential field and follow normal password-storage practices for the platform being used.

## Separate game accounts
- Staff should keep a separate account for the website/company portal and a separate account for the game.
- This document does not implement that separation; it is a notes file for the next stage.

# Public player accounts

## Current behavior
- Public player sign up and player log in are not active.
- The site currently has no usable public player sign-up path.

## Requested behavior
- The product should feel like an actual game with public sign-in and sign-ups.
- Player profiles should exist on the game side.

## Implementation status
- Not implemented yet.
- This file is a planning note, not a code change.
