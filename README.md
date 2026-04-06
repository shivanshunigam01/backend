# Patliputra Group × VinFast Backend

Production-ready Express + MongoDB backend scaffold aligned to the API documentation shared by the user.

## Stack
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT auth
- Cloudinary metadata/delete support
- Express Validator
- Rate limiting

## Quick start
1. Copy `.env.example` to `.env`
2. Install dependencies
   ```bash
   npm install
   ```
3. Seed first admin
   ```bash
   npm run seed:admin
   ```
4. Start server
   ```bash
   npm run dev
   ```

## Base URLs
- Public: `/api/v1`
- Admin: `/api/v1/admin`

## Notes
- Media upload is assumed to happen directly from frontend to Cloudinary using an unsigned preset.
- Backend stores metadata and can delete Cloudinary assets using server credentials.
- Singleton collections (`SiteConfig`, `DealerSettings`) are upserted on update and lazily defaulted on first read.
