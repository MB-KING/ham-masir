# Phase 1 Architecture

## System Architecture

Ham-Masir is built as a modular monolith in Next.js. The backend lives in API route handlers, but domain behavior is separated into services, repositories, schemas, and policy helpers so it can later move to an independent service without rewriting the business rules.

## Prisma Models

The Prisma schema includes:

- `Community`
- `User`, `UserProfile`, `UserRole`
- `Event`, `EventRegistration`, `Attendance`
- `Badge`, `UserBadge`, `XPTransaction`, `Level`
- `Business`, `BusinessMember`
- `Reward`, `RewardCode`, `RewardRedemption`
- `AuditLog`, `Notification`

Critical constraints:

- `User.telegramId` is unique but not the domain primary key.
- `EventRegistration` is unique by `(userId, eventId)`.
- `Attendance` is unique by `(userId, eventId)`.
- `XPTransaction` is unique by user, type, and reference to avoid duplicate awards.
- `UserBadge` is unique by `(userId, badgeId)`.

## Authentication Flow

Telegram `initData` is validated according to Telegram Mini App HMAC rules. Raw init data is not logged. After validation, the user is upserted by Telegram ID and receives an internal UUID.

## Authorization Strategy

Roles are stored as `UserRole` rows. API route handlers call `requireCurrentUser()` and `requireRole()` before sensitive operations. The current roles are:

- `USER`
- `ADMIN`
- `SUPER_ADMIN`
- future-ready: `EVENT_MANAGER`, `BUSINESS_OWNER`, `MODERATOR`

## Event Registration Flow

Registration checks:

- event exists
- event status is `PUBLISHED`
- deadline has not passed
- user does not already have active registration
- capacity decides `REGISTERED` vs `WAITLISTED`

Registration does not award XP.

## Attendance Flow

Attendance is verified manually by an admin in MVP. Verification updates or creates an `Attendance` row. When status becomes `PRESENT`, the attendance service orchestrates XP and badge evaluation.

## XP And Badge Flow

`XPService` owns centralized XP rules. `BadgeService` grants attendance-count badges idempotently. Levels are calculated by `LevelService` from database-backed level thresholds.

## Reward Flow

Approved rewards are public. Redemption re-checks status, expiration, user eligibility, usage limits, per-user limits, and optional reward codes inside a transaction.
