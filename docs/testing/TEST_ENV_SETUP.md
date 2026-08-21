# Attend — Test Environment Setup

Use this checklist before running [TEST_MANUAL.md](./TEST_MANUAL.md).

## 1. Install & configure

```bash
cd Attend
npm install
cp apps/backend/.env.example apps/backend/.env
# Fill SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
```

Run Supabase migrations (including `001_add_sections.sql` and `002_one_section_per_student_per_subject.sql`).

## 2. Start all services

```bash
npm run dev
```

Verify:
- Backend: http://localhost:8000/docs
- Mobile: Expo QR in Turbo logs
- Desktop: Electron window opens

## 3. Mobile device connection

- Phone and computer on **same WiFi**
- Login screen → **Test connection** should succeed
- If not: set `EXPO_PUBLIC_API_URL=http://YOUR_IP:8000` in `apps/mobile/.env`, then `npx expo start --clear`

Find IP: `ipconfig getifaddr en0`

## 4. Recommended test account order

Create in this order to unblock all workflows:

1. **PLATFORM_ADMIN** — SQL seed or desktop (see README)
2. **College** — desktop
3. **SUPER_ADMIN** — desktop (per college)
4. **Department + Subject** — desktop
5. **DEPARTMENT_ADMIN** — desktop or mobile
6. **TEACHER** — mobile (dept admin)
7. **Students** — mobile enrollment (3 face photos)

## 5. Physical testing tips (face recognition)

- Enroll at least 3 students with clear front/left/right photos
- Test attendance in the same lighting as enrollment when possible
- Record confidence scores in TEST_MANUAL section 8
- For classroom scale test, use Scenario C in section 13

## 6. Quick verification

```bash
npm run check-setup
curl http://localhost:8000/health
```
