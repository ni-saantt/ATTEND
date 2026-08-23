---
name: Test environment setup
about: Preflight before a QA or enrollment session — install, services, accounts
title: "[ENV] Test environment setup"
labels: ["test-run"]
---

> **Workbook:** `docs/testing/TEST_ENV_SETUP.md`  
> Complete this issue **before** a Full QA or Enrollment practical test run. Tick each item only after you have verified it.  
> When this is done, open a new issue from **Full QA test run** and/or **Enrollment practical test**.

---

## Session

| Field | Value |
|-------|-------|
| **Tester** | |
| **Date** | |
| **Machine / OS** | |
| **Git branch / commit** | |

---

## 1. Install and configure

```bash
cd Attend
npm install
cp apps/backend/.env.example apps/backend/.env
# Fill SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
```

- [ ] `npm install` completed with no errors
- [ ] `apps/backend/.env` exists (do not paste secrets into this issue)
- [ ] `SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_KEY` is set
- [ ] `JWT_SECRET` is set
- [ ] Supabase migration `001_add_sections.sql` applied
- [ ] Supabase migration `002_one_section_per_student_per_subject.sql` applied

**Notes:**

---

## 2. Start all services

```bash
npm run dev
```

- [ ] `npm run dev` is running (Turbo TUI, no crash loops)
- [ ] Backend docs open: http://localhost:8000/docs
- [ ] `GET /health` returns `{"status":"ok"}` (`curl http://localhost:8000/health` or `npm run check-setup`)
- [ ] Mobile Expo QR is visible in Turbo logs
- [ ] Admin desktop Electron window opens

**Notes:**

---

## 3. Mobile device connection

- [ ] Phone and computer are on the **same WiFi**
- [ ] Login screen → **Test connection** succeeds
- [ ] If it failed: set `EXPO_PUBLIC_API_URL=http://YOUR_IP:8000` in `apps/mobile/.env`, then `npx expo start --clear`, and retry

Find Mac IP: `ipconfig getifaddr en0`  
**API URL used on the phone:**

---

## 4. Seed accounts (create in this order)

Each step unblocks the next. Tick when that account can log in.

- [ ] **1. PLATFORM_ADMIN** — SQL seed or desktop (see README)
- [ ] **2. College** — created on desktop
- [ ] **3. SUPER_ADMIN** — created on desktop (per college)
- [ ] **4. Department + Subject** — created
- [ ] **5. DEPARTMENT_ADMIN** — desktop or mobile
- [ ] **6. TEACHER** — created by dept admin on mobile
- [ ] **7. Students** — at least 3 enrolled with front / left / right photos (needed before attendance tests)

| Role | Email (test only) | College / Dept |
|------|-------------------|----------------|
| PLATFORM_ADMIN | | |
| SUPER_ADMIN | | |
| DEPARTMENT_ADMIN | | |
| TEACHER | | |

---

## 5. Physical testing tips (face recognition)

- [ ] At least 3 students enrolled with **clear** front / left / right photos
- [ ] Attendance will be tested in **similar lighting** to enrollment when possible
- [ ] I will record confidence scores during attendance (Full QA section 8)
- [ ] For a classroom-scale run I will also open an **Enrollment practical test** issue

---

## 6. Quick verification

```bash
npm run check-setup
curl http://localhost:8000/health
```

- [ ] `npm run check-setup` succeeded
- [ ] `curl http://localhost:8000/health` returned OK

**Blocked by:**  
**Ready for:** Full QA / Enrollment practical / both
