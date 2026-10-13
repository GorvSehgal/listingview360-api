# Listing approval and multi-image uploads

## Realtor workflow
1. Admin provisions realtor credentials using the existing private account-creation script.
2. Realtor signs in on the frontend listing dashboard.
3. Realtor uploads one or more JPEG, PNG or WebP files (max 15 per listing, 5 MB per file). The API uploads them to Cloudinary via authenticated `POST /api/v1/uploads/images`. Files are **not** stored on the API server's ephemeral disk.
4. Realtor creates or edits a listing using returned HTTPS image URLs. It enters `pending` review. Listing updates reset approval to `pending`.
5. Realtors can view/edit only their own listings. They cannot approve or reject.

## Admin workflow
1. Admin signs in with an existing admin account.
2. Admin retrieves `GET /api/v1/properties/manage`, which includes all properties and review statuses.
3. Admin verifies title, licensing, photo rights and other facts, then approves or rejects using `PATCH /api/v1/properties/:id/review` with body `{"status":"approved"}` or `{"status":"rejected"}`.
4. Only approved listings appear at public `GET /api/v1/properties` and `GET /api/v1/properties/:id`. Non-approved IDs return 404, including direct links.

## Before release
- Review auth PR and AI PR (this branch builds on both); run DB backup and `npx prisma migrate deploy` **before** serving new code.
- Configure `DATABASE_URL`, `JWT_SECRET`, exact `CORS_ORIGINS`, and all three `CLOUDINARY_*` variables on the backend. Set frontend `VITE_API_BASE_URL` to the HTTPS API URL ending in `/api/v1`.
- Provision the admin through protected runtime environment, not public registration.
- The migration intentionally makes all legacy records pending. Review them explicitly; seeded demos are not actual for-sale properties.
- Use monitoring, backups, upload quotas/rate limiting, CSRF/XSS review, distributed throttles and malware/image transcoding in production. The minimal file-signature validation is not a full media security pipeline.
