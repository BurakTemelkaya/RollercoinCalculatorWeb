
# Club profile API (Aşama 1) — backend integration contract

Status: NOT IMPLEMENTED ON THE SERVER. This repository contains only the React client; no .NET solution, DbContext, database provider or migration history was available. No migration was guessed or executed. Do not set VITE_CLUB_API_ENABLED=true until the server below has been implemented and integration-tested.

Existing identity: /api/Auth Login, Register, RefreshToken and RevokeToken. Reuse its verified JWT subject (nameidentifier). Never use a request userId or client-decoded role as authorization. No new identity database or login system.

## Endpoints
- GET /api/Club/me: authenticated bearer only; returns own ClubProfile, or 204 if none. No shared caching.
- PUT /api/Club/me: authenticated bearer only. Creates or updates own profile. Allow only username, displayName, avatarUrl, bio, visibility, version. Reject userId, xp, level, badges and roles (mass-assignment prevention). Return full server-owned profile. 409 for duplicate normalized username or version conflict; 400 for validation; 401 unauthenticated; 403 unauthorized; 429 rate limited.
- DELETE /api/Club/me: delete/anonymize own Club profile according to documented retention policy, leaving the existing site account untouched. 204 on success. Remove profile personal data from operational stores and expire backups according to policy. The client requires explicit confirmation before this request.

Response: userId (existing identity key), username (normalized lowercase 3–24 ASCII alphanumeric/underscore), displayName (1–60), avatarUrl (nullable HTTPS), joinedAt (server timestamp), bio (0–500), visibility (private/public, private default), level (server integer >=1), xp (server integer >=0), badges [{id,name}], version (opaque concurrency token). Public profile endpoints are NOT part of Aşama 1.

## Controlled migration to create when backend is available
Use the actual backend's ORM migration system and provider. Create ClubProfiles with existing Users primary key as PK/FK (1:1), unique database index on normalized username (case-insensitive), display name, avatar reference, description, private visibility default, server-created timestamp, server XP/level defaults and concurrency token. Add check constraints for non-negative XP, valid visibility/level and string lengths. Ensure deletion behavior agrees with the existing account deletion flow. Store earned badges in a minimal association only when badges are introduced; no collection, council, arena, pass or guild tables now. Rehearse up/down migration on a copy, preserve existing accounts, and never run down against production without backup/review.

## Security acceptance criteria (server work remains)
Verify JWT signature, issuer, audience, expiry on every Club request. Resolve own ID from verified claims; test cross-user access denied. Apply existing admin policy to existing admin routes. XP/level/badges are read-only for members, including crafted HTTP requests. Enforce login/register rate limits on server by IP and normalized account, avoid account enumeration, retain existing Turnstile validation. Apply profile write limits separately. Do not describe frontend button disabling as rate limiting.

Club endpoints use explicit Authorization header and credentials:omit, must NOT accept ambient cookie-only authentication. Restrict CORS to trusted origins. This avoids cookie-based CSRF for Club writes; existing cookie refresh/revoke endpoints still need same-site secure HttpOnly cookie settings plus server Origin/CSRF protections appropriate to their implementation. Existing refresh cookie flags, rate-limit policies and JWT validation could not be audited here. Existing localStorage access token storage is preserved, not replaced or declared newly secure.

React renders profile strings as text, never dangerouslySetInnerHTML. Server must validate all fields and escape any future HTML rendering. Avatar URLs must be HTTPS and validated; do not fetch arbitrary avatar URLs server-side without SSRF controls. Prefer a controlled image upload/CDN later. No RollerCoin password, cookies, API keys or private game account data are collected.

Required real tests once backend exists: register/login/logout, expired/invalid token, duplicate username race, own vs other profile, member denied admin, forged XP/level fields rejected, CSRF/cookie-only rejection, rate-limit 429, profile create/update/concurrent conflict, private visibility, delete and account retention. None are claimed passed by the frontend build.
