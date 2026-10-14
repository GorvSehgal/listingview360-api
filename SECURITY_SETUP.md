# ListingView360 API — authentication and security

## Overview

This PR adds a `User` table, role-based (admin/realtor) access control, salted scrypt password hashes, and HS256 signed short-lived JWTs. Public GET requests for property browsing are preserved.

The API **does not** allow public user registration. Create staff/realtor accounts deliberately after verifying their identity. Never store real passwords or JWT secrets in version control.

## Initial setup

1. Back up the database and configure `DATABASE_URL` in a secret environment variable.
2. Set `JWT_SECRET` to a **random value** generated with `openssl rand -base64 48`. Do not use the example/test secret.
3. Set `CORS_ORIGINS` to a comma-separated list of the exact trusted frontend origins (including https://).
4. Run `npm ci`, `npx prisma migrate deploy`, and `npm run build` before starting the server.
5. Create the first account in your admin workstation or hosting environment, without passing its password on the command line:

   ```sh
   export USER_EMAIL="admin@example.com"
   export USER_ROLE="admin"
   read -rs -p "Account password: " USER_PASSWORD && echo
   export USER_PASSWORD
   npm run user:create
   unset USER_PASSWORD
   ```

   Account passwords must be at least 12 characters, maximum 128 UTF-8 bytes.

6. Repeat with `USER_ROLE=realtor` for a trusted realtor.

**The migration does not automatically assign ownership of existing listings.** Existing properties have a null `ownerId`. They remain visible to everyone, but only an admin may modify or delete them. Newly created properties are owned by the authenticated account.

## HTTP endpoints

`POST /api/v1/auth/login` — JSON body `{"email":"admin@example.com","password":"..."}`, returns `data.accessToken` with a 1-hour expiry.

`GET /api/v1/auth/me` — requires header `Authorization: Bearer <token>`, returns current account ID/email/role from the database.

`GET /api/v1/properties` and `GET /api/v1/properties/:id` — public.

`POST /api/v1/properties` — requires an active admin/realtor account; new listing is assigned to the caller.

`PATCH /api/v1/properties/:id` and `DELETE /api/v1/properties/:id` — admin may edit any; realtors can edit only records they own. Other properties return 404.

```sh
TOKEN="<copy-accessToken-from-login-response>"
curl -X GET http://localhost:3000/api/v1/auth/me -H "Authorization: Bearer $TOKEN"
```

## Known deployment requirements

- The frontend still needs a secure login/account experience and a safe access-token storage strategy. **Never put JWTs into URLs or persist them in localStorage for production without a reviewed threat model.**
- HTTPS/TLS is mandatory for real credentials.
- The in-memory per-IP login throttle is for one API instance only; use a distributed gateway/Redis limit for production, after setting trusted proxy handling.
- Set security monitoring, backups, secret rotation, audit logs, incident procedures, session revocation/refresh controls, and security tests before labeling the system production-ready.
- Admins should verify realtor identities and rights to publish real listings. User-provided names and photos are not yet verified.
- The current seed script **deletes and recreates all properties**; never run `npm run seed` against production data.
- Build, database migration, and integration tests require a configured development environment. Tests in this PR cover the crypto primitives; authorization should additionally be tested with an isolated PostgreSQL database.

## AI-assisted listing description drafts (optional)

Supply `GEMINI_API_KEY` only to the backend and, if needed, choose a permitted model via `GEMINI_MODEL`. Model availability and billing depend on your Google account. The key is **never sent to clients**.

`POST /api/v1/ai/listing-description` requires a valid admin/realtor bearer token. Example JSON:

```json
{
  "title": "Bright Toronto Condo",
  "propertyType": "Condo",
  "city": "Toronto",
  "province": "ON",
  "bedrooms": 2,
  "bathrooms": 2,
  "features": ["Balcony", "Parking"],
  "tone": "professional"
}
```

Returns a text draft and `needsReview: true`. No database writes occur. Review and verify every claim before publishing. This is a human-assistance feature, not a verified source of property facts.

An in-process per-account throttle limits API costs in a single instance. For scaled deployments enforce a distributed per-account usage budget and monitor token usage; the external Gemini API is a paid third-party dependency.
