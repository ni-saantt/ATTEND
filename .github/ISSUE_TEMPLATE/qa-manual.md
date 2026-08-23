---
name: Full QA test run
about: Full manual test workbook — every case with steps, expected result, and Pass
title: "[TR] Full QA test run"
labels: ["test-run"]
---

> **Workbook:** `docs/testing/TEST_MANUAL.md` (v1.0)  
> **Purpose:** End-to-end manual testing of all Attend features (Platform Admin, Super Admin, Department Admin, Teacher) on Mobile + Desktop + Backend.  
> **How to use:** Fill the session header and seed data → work section by section → tick **Pass** when the expected result is observed → write Actual / IDs in the blank fields.  
> For a failure, open a separate **bug** issue and link it in the bug log. GitHub shows checklist progress at the top of this issue.

---

## Test session header

| Field | Value |
|-------|-------|
| **Test run ID** | TR- |
| **Tester name** | |
| **Date** | |
| **Start time** | |
| **End time** | |
| **Git commit / branch** | |
| **Backend URL** | e.g. `http://10.x.x.x:8000` |
| **Mobile device** | e.g. iPhone / Android + OS |
| **Desktop OS** | e.g. macOS / Windows |
| **Network** | Same WiFi? Y / N |
| **Supabase project** | |
| **Overall result** | Pass / Fail / Partial |

---

## 1. Environment and preflight

### 1.1 Services running

- [ ] `npm run dev` starts without errors (Turbo TUI)
- [ ] Backend health: `GET /health` returns `{"status":"ok"}`
- [ ] Backend docs load: `/docs`
- [ ] Mobile Expo bundle loads (Android / iOS)
- [ ] Admin desktop Electron window opens
- [ ] Shared package `tsc --watch` running (no errors)

- [ ] **Pass** — Backend listens on `0.0.0.0:8000` — **Actual port:**
- [ ] **Pass** — Mobile **Test connection** reaches the API — **Actual:**
- [ ] **Pass** — Desktop `VITE_API_URL` points at the backend — **Actual:**

**Notes:**

### 1.2 Test accounts (fill before testing)

Do not put real production passwords here if this repo is public — use a test-only account.

| Email | Role | College | Department | Ready |
|-------|------|---------|------------|-------|
| | PLATFORM_ADMIN | | | [ ] |
| | SUPER_ADMIN | | | [ ] |
| | DEPARTMENT_ADMIN | | | [ ] |
| | TEACHER | | | [ ] |

- [ ] PLATFORM_ADMIN account works
- [ ] SUPER_ADMIN account works
- [ ] DEPARTMENT_ADMIN account works
- [ ] TEACHER account works

### 1.3 Seed test data (fill as created)

| Entity | Name / ID |
|--------|-----------|
| College | |
| Department | |
| Subject 1 | |
| Subject 2 | |
| Section A (Subject 1) | |
| Section B (Subject 1) | |
| Teacher (assigned Section A) | |
| Student S1 (Section A) `reg_no` | |
| Student S2 (Section A) `reg_no` | |
| Student S3 (Section B) `reg_no` | |

- [ ] Seed data above is created and IDs recorded

---

## 2. Authentication and connection

### 2.1 Mobile — Login screen

**Actual API_BASE used:**  
**Login response time (ms):**

- [ ] **AUTH-M-01 Pass** — Test connection
  - **Steps:** On login, tap **Test connection**.
  - **Expected:** Alert: Connection OK, `/health` response.
  - **Actual:**

- [ ] **AUTH-M-02 Pass** — Valid login
  - **Steps:** Enter valid email + password → Login.
  - **Expected:** Redirect to Dashboard, or profile-edit if name/contact is incomplete.
  - **Actual:**

- [ ] **AUTH-M-03 Pass** — Invalid password
  - **Steps:** Correct email, wrong password → Login.
  - **Expected:** Error: Login Failed.
  - **Actual:**

- [ ] **AUTH-M-04 Pass** — Invalid email format
  - **Steps:** Enter a badly formed email.
  - **Expected:** Validation error; login does not proceed.
  - **Actual:**

- [ ] **AUTH-M-05 Pass** — Unverified email
  - **Steps:** Login with an account that has not verified email.
  - **Expected:** Redirect to verify-email (or equivalent block).
  - **Actual:**

- [ ] **AUTH-M-06 Pass** — Logout
  - **Steps:** Profile → sign out (or clear token).
  - **Expected:** Returns to login; protected screens are blocked.
  - **Actual:**

### 2.2 Mobile — Sign up and verify

**Test email used:**

- [ ] **AUTH-M-07 Pass** — Sign up new user
  - **Expected:** Account created; verify prompt shown.
  - **Actual:**

- [ ] **AUTH-M-08 Pass** — Verify email link
  - **Expected:** Link opens; account becomes verified.
  - **Actual:**

- [ ] **AUTH-M-09 Pass** — Resend verification
  - **Expected:** Resend succeeds.
  - **Actual:**

### 2.3 Desktop — Login

- [ ] **AUTH-D-01 Pass** — Platform admin login
  - **Expected:** Dashboard loads.
  - **Actual:**

- [ ] **AUTH-D-02 Pass** — Invalid credentials
  - **Expected:** Error shown; no dashboard.
  - **Actual:**

- [ ] **AUTH-D-03 Pass** — Sign out
  - **Expected:** Returns to login; protected routes blocked.
  - **Actual:**

- [ ] **AUTH-D-04 Pass** — Unauthenticated access
  - **Steps:** With no token, open `/colleges` (or equivalent).
  - **Expected:** Redirect to login.
  - **Actual:**

---

## 3. Desktop app — Platform Admin

### 3.1 Dashboard

- [ ] Dashboard loads after login
- [ ] Navigation sidebar visible (Dashboard, Colleges)
- [ ] Sign Out works

**Notes:**

### 3.2 Colleges

**College created name:**  
**College ID:**

- [ ] **DESK-01 Pass** — List colleges
  - **Steps:** Open Colleges page.
  - **Expected:** All colleges listed.
  - **Actual:**

- [ ] **DESK-02 Pass** — Create college
  - **Steps:** Create College → submit name.
  - **Expected:** College appears in the list.
  - **Actual:**

- [ ] **DESK-03 Pass** — Edit college
  - **Expected:** Name / details saved.
  - **Actual:**

- [ ] **DESK-04 Pass** — Upload college logo (if UI present)
  - **Expected:** Logo URL stored and displays.
  - **Actual:**

- [ ] **DESK-05 Pass** — View college detail
  - **Expected:** Detail page loads.
  - **Actual:**

### 3.3 Super Admin creation (per college)

**Super admin email created:**

- [ ] **DESK-06 Pass** — Create super admin
  - **Expected:** User created with `SUPER_ADMIN` role.
  - **Actual:**

- [ ] **DESK-07 Pass** — Super admin can login on mobile
  - **Expected:** New super admin logs in on mobile.
  - **Actual:**

### 3.4 Departments (per college)

**Department name:**  
**Department ID:**

- [ ] **DESK-08 Pass** — List departments
  - **Expected:** Departments for the college are shown.
  - **Actual:**

- [ ] **DESK-09 Pass** — Create department
  - **Expected:** New department saved.
  - **Actual:**

- [ ] **DESK-10 Pass** — Delete department (if allowed)
  - **Expected:** Department removed, or a clear “not allowed” message.
  - **Actual:**

### 3.5 Users (per college)

- [ ] **DESK-11 Pass** — List users
  - **Expected:** Users filtered by college.
  - **Actual:**

- [ ] **DESK-12 Pass** — Create user (dept admin)
  - **Expected:** User with `DEPARTMENT_ADMIN` role.
  - **Actual:**

- [ ] **DESK-13 Pass** — Create user (teacher)
  - **Expected:** User with `TEACHER` role.
  - **Actual:**

- [ ] **DESK-14 Pass** — Delete user
  - **Expected:** User removed.
  - **Actual:**

### 3.6 Subjects (per department)

**Subject 1 name:**  
**Subject 2 name:**

- [ ] **DESK-15 Pass** — List subjects
  - **Expected:** Subjects for the department shown.
  - **Actual:**

- [ ] **DESK-16 Pass** — Create subject
  - **Expected:** Subject saved.
  - **Actual:**

- [ ] **DESK-17 Pass** — Edit subject
  - **Expected:** Name updated.
  - **Actual:**

- [ ] **DESK-18 Pass** — Delete subject
  - **Expected:** Subject removed.
  - **Actual:**

- [ ] **DESK-19 Pass** — Enroll students to subject
  - **Expected:** Students linked via `subject_students`.
  - **Actual:**

### 3.7 Students view (desktop)

- [ ] **DESK-20 Pass** — List students
  - **Expected:** Students by college/dept visible.
  - **Actual:**

- [ ] **DESK-21 Pass** — Student detail
  - **Expected:** `reg_no`, name, image URLs shown.
  - **Actual:**

---

## 4. Mobile — Dashboard and profile

### 4.1 Dashboard (check per role)

- [ ] **DASH-01 Pass** — All roles: **Take Attendance** visible and opens `attendance`
- [ ] **DASH-02 Pass** — All roles: **Enroll Student** visible and opens `enroll`
- [ ] **DASH-03 Pass** — All roles: **View Reports** visible and opens `reports`
- [ ] **DASH-04 Pass** — Super / Dept: **My department** (Department Hub) opens `department-hub`
- [ ] **DASH-05 Pass** — Super only: **Create Department Admin** opens `create-department-admin` (hidden for Teacher)
- [ ] **DASH-06 Pass** — Teacher: **Section Students** opens `section-students`

**Notes:**

### 4.2 Profile

**Updated name:**  
**Updated contact:**

- [ ] **PROF-01 Pass** — Profile screen loads
  - **Expected:** Name, email, role displayed.
  - **Actual:**

- [ ] **PROF-02 Pass** — Profile card
  - **Expected:** Full profile view.
  - **Actual:**

- [ ] **PROF-03 Pass** — Profile edit — name
  - **Expected:** Name saved via API and shown after reload.
  - **Actual:**

- [ ] **PROF-04 Pass** — Profile edit — contact
  - **Expected:** Contact number saved.
  - **Actual:**

- [ ] **PROF-05 Pass** — Incomplete profile redirect
  - **Steps:** Login as a user missing name or contact.
  - **Expected:** Redirect to profile-edit.
  - **Actual:**

---

## 5. Mobile — User management

### 5.1 Super Admin — Create Department Admin

**Created dept admin email:**

- [ ] **USER-01 Pass** — Open Create Dept Admin
  - **Expected:** Form loads.
  - **Actual:**

- [ ] **USER-02 Pass** — Create with valid data
  - **Expected:** User created and can log in.
  - **Actual:**

- [ ] **USER-03 Pass** — Duplicate email
  - **Expected:** Error returned; no second user.
  - **Actual:**

- [ ] **USER-04 Pass** — Missing required fields
  - **Expected:** Validation error.
  - **Actual:**

### 5.2 Department Admin — Create Teacher

**Created teacher email:**

- [ ] **USER-05 Pass** — Open Add Teacher
  - **Expected:** Form loads.
  - **Actual:**

- [ ] **USER-06 Pass** — Create teacher
  - **Expected:** `TEACHER` role user created.
  - **Actual:**

- [ ] **USER-07 Pass** — Teacher login
  - **Expected:** New teacher can log in on mobile.
  - **Actual:**

### 5.3 Department Hub navigation

- [ ] **HUB-01 Pass** — View Students → `student-list` loads
- [ ] **HUB-02 Pass** — View Teachers → `teacher-list` loads
- [ ] **HUB-03 Pass** — Section Students → `section-students` loads
- [ ] **HUB-04 Pass** — Manage Sections → `manage-sections` loads
- [ ] **HUB-05 Pass** — Add Teacher → `create-teacher` loads

### 5.4 Student list and teacher list

- [ ] **LIST-01 Pass** — Student list shows department students (names + `reg_no`)
- [ ] **LIST-02 Pass** — Tap student → `edit-student` screen
- [ ] **LIST-03 Pass** — Teacher list shows department teachers (names + emails)

---

## 6. Section management

### 6.1 Department Admin — Create and manage sections

**Section A ID:**  
**Section B ID:**  
**Teacher assigned:**

- [ ] **SEC-01 Pass** — Open Manage Sections
  - **Steps:** Select a subject.
  - **Expected:** Section list for that subject.
  - **Actual:**

- [ ] **SEC-02 Pass** — Create Section A
  - **Steps:** Name `A`.
  - **Expected:** Section created (stored uppercase).
  - **Actual:**

- [ ] **SEC-03 Pass** — Create Section B
  - **Steps:** Name `B`.
  - **Expected:** Second section created.
  - **Actual:**

- [ ] **SEC-04 Pass** — Duplicate section name
  - **Steps:** Create `A` again on the same subject.
  - **Expected:** Error: name already exists.
  - **Actual:**

- [ ] **SEC-05 Pass** — Assign teacher to Section A
  - **Steps:** Checkbox modal → Save.
  - **Expected:** Teacher listed on the section.
  - **Actual:**

- [ ] **SEC-06 Pass** — Assign multiple teachers
  - **Expected:** Two teachers shown on one section.
  - **Actual:**

- [ ] **SEC-07 Pass** — Remove teacher from section
  - **Expected:** Teacher assignment removed.
  - **Actual:**

- [ ] **SEC-08 Pass** — Delete section
  - **Steps:** Confirm delete (use a spare section if you still need A/B later).
  - **Expected:** Section removed.
  - **Actual:**

### 6.2 Teacher / Admin — Section student roster

**Students added to Section A:**  
**Conflict test student:**  
**Error message received:**

- [ ] **SEC-09 Pass** — My Sections lists assigned subjects
  - **Expected:** Teacher sees only assigned sections.
  - **Actual:**

- [ ] **SEC-10 Pass** — Open section student list
  - **Expected:** `section-students-list` loads.
  - **Actual:**

- [ ] **SEC-11 Pass** — Edit mode → Add students
  - **Steps:** Multi-select → Add.
  - **Expected:** Students appear in the roster.
  - **Actual:**

- [ ] **SEC-12 Pass** — Add student already in Section B (same subject)
  - **Expected:** Blocked. Error: one section per student per subject.
  - **Actual:**

- [ ] **SEC-13 Pass** — Remove student from section
  - **Expected:** Student removed from roster.
  - **Actual:**

- [ ] **SEC-14 Pass** — Teacher not assigned to section
  - **Expected:** Cannot edit roster (403 or UI blocked).
  - **Actual:**

---

## 7. Student enrollment

### 7.1 Enroll new student (3 face poses)

**Student `reg_no`:**  
**Student name:**  
**Student ID:**  
**Enrollment time (sec):**

- [ ] **ENR-01 Pass** — Step 1 — enter `reg_no`, name
  - **Expected:** Validation passes.
  - **Actual:**

- [ ] **ENR-02 Pass** — Select college (super admin)
  - **Expected:** College picker works. (N/A for teacher/dept admin.)
  - **Actual:**

- [ ] **ENR-03 Pass** — Select department
  - **Expected:** Department picker works (or is fixed to own dept).
  - **Actual:**

- [ ] **ENR-04 Pass** — Proceed to camera
  - **Expected:** `enroll-camera` opens.
  - **Actual:**

- [ ] **ENR-05 Pass** — Capture front face
  - **Expected:** Face detected.
  - **Actual:**

- [ ] **ENR-06 Pass** — Capture left face
  - **Expected:** Face detected.
  - **Actual:**

- [ ] **ENR-07 Pass** — Capture right face
  - **Expected:** Face detected.
  - **Actual:**

- [ ] **ENR-08 Pass** — Submit enrollment
  - **Expected:** Student created in the database.
  - **Actual:**

- [ ] **ENR-09 Pass** — Embeddings stored
  - **Expected:** 3 embeddings (`front` / `left` / `right`).
  - **Actual:**

- [ ] **ENR-10 Pass** — Images in storage
  - **Expected:** Paths in `primary-faces` bucket.
  - **Actual:**

- [ ] **ENR-11 Pass** — FAISS cache invalidated
  - **Expected:** Recognition works immediately (no backend restart).
  - **Actual:**

### 7.2 Enrollment — negative cases

- [ ] **ENR-12 Pass** — No face in front image
  - **Expected:** Error: no face detected.
  - **Actual:**

- [ ] **ENR-13 Pass** — Missing left/right pose
  - **Expected:** Error before submit.
  - **Actual:**

- [ ] **ENR-14 Pass** — Duplicate `reg_no`
  - **Expected:** Error from API; no second student.
  - **Actual:**

### 7.3 Edit student and add face

- [ ] **ENR-15 Pass** — Edit student name / `reg_no`
  - **Expected:** Saved in UI and DB.
  - **Actual:**

- [ ] **ENR-16 Pass** — Add face camera — update left
  - **Expected:** New left embedding + `left.jpg`.
  - **Actual:**

- [ ] **ENR-17 Pass** — Add face camera — update right
  - **Expected:** New right embedding + `right.jpg`.
  - **Actual:**

- [ ] **ENR-18 Pass** — Delete student (if UI exists)
  - **Expected:** Student removed, or N/A if no UI.
  - **Actual:**

For a 10 / 25 / 50 student classroom run, use the **Enrollment practical test** issue template as well.

---

## 8. Attendance and face recognition

### 8.1 Attendance setup

**Subject selected:**  
**Section selected:**

- [ ] **ATT-01 Pass** — Teacher with no sections
  - **Expected:** Empty state message.
  - **Actual:**

- [ ] **ATT-02 Pass** — Select subject
  - **Expected:** Sections list updates.
  - **Actual:**

- [ ] **ATT-03 Pass** — Select section
  - **Expected:** Start enabled.
  - **Actual:**

- [ ] **ATT-04 Pass** — Super admin test recognition button (if visible)
  - **Expected:** `test_mode` camera opens.
  - **Actual:**

### 8.2 Single-photo attendance

| Field | Value |
|-------|-------|
| Student matched | |
| Confidence score | |
| Recognition latency (approx) | |
| `attendance_id` (after save) | |
| `face_crop_url` | |

- [ ] **ATT-05 Pass** — Capture photo with enrolled student
  - **Expected:** Match shown with name and `reg_no`.
  - **Actual:**

- [ ] **ATT-06 Pass** — Confidence score displayed
  - **Expected:** Score above threshold (record in the table).
  - **Actual:**

- [ ] **ATT-07 Pass** — Reference image shown
  - **Expected:** `primary_image_url` loads.
  - **Actual:**

- [ ] **ATT-08 Pass** — Face crop preview
  - **Expected:** Bounding box / crop visible.
  - **Actual:**

- [ ] **ATT-09 Pass** — Confirm and save
  - **Expected:** Attendance record created.
  - **Actual:**

- [ ] **ATT-10 Pass** — Reject / skip unknown
  - **Expected:** No record saved for the unknown face.
  - **Actual:**

### 8.3 Live stream attendance

**Session ID:**  
**Students marked present:**

- [ ] **ATT-11 Pass** — Start live session
  - **Expected:** Stream session started.
  - **Actual:**

- [ ] **ATT-12 Pass** — Frame 1 — student recognized
  - **Expected:** Match appears.
  - **Actual:**

- [ ] **ATT-13 Pass** — Same student in frame 2
  - **Expected:** Dedup — not double-counted.
  - **Actual:**

- [ ] **ATT-14 Pass** — Multiple students in frame
  - **Expected:** Multiple matches.
  - **Actual:**

- [ ] **ATT-15 Pass** — Confirm batch save
  - **Expected:** All accepted records saved.
  - **Actual:**

- [ ] **ATT-16 Pass** — End stream session
  - **Expected:** Session cleared.
  - **Actual:**

### 8.4 Recognition edge cases

| Edge case | Expected | Actual |
|-----------|----------|--------|
| Unknown face | `unknown: true` | |
| Out-of-section enrolled | unknown / filtered | |
| Low confidence | Below threshold → unknown | |

- [ ] **ATT-17 Pass** — Unknown person (not enrolled) shown as unknown
- [ ] **ATT-18 Pass** — Enrolled student **not** in section roster treated as unknown
- [ ] **ATT-19 Pass** — Student in college, wrong section → no match / unknown
- [ ] **ATT-20 Pass** — Poor lighting / angle — record actual behavior:
- [ ] **ATT-21 Pass** — No face in frame → no matches or empty results
- [ ] **ATT-22 Pass** — Super admin test mode (`/recognize/test`) matches across college (no subject filter)

### 8.5 Attendance record verification

**Sample record JSON / ID:**

- [ ] **ATT-23 Pass** — Record has correct `student_id`
- [ ] **ATT-24 Pass** — Record has correct `subject_id`
- [ ] **ATT-25 Pass** — Record has correct `section_id`
- [ ] **ATT-26 Pass** — Record has `attendance_date` = today
- [ ] **ATT-27 Pass** — Record `confidence` matches the UI score
- [ ] **ATT-28 Pass** — `face_crop_url` is accessible
- [ ] **ATT-29 Pass** — Delete attendance record (if UI exists)

---

## 9. Reports and exports

### 9.1 Reports list

**Subject tested:**  
**Record count shown:**

- [ ] **RPT-01 Pass** — Empty state (no attendance) shows “No reports yet” (or equivalent)
- [ ] **RPT-02 Pass** — Subject with attendance appears on the reports screen
- [ ] **RPT-03 Pass** — Open reports detail — records for the subject shown
- [ ] **RPT-04 Pass** — Filter by section (if UI) — section-scoped records
- [ ] **RPT-05 Pass** — Attendance record detail — single record view

### 9.2 Export — Excel

**File name:**  
**Row count:**

- [ ] **RPT-06 Pass** — Download Excel report (file downloads / shares)
- [ ] **RPT-07 Pass** — Excel students, names, dates match the UI
- [ ] **RPT-08 Pass** — Excel contains confidence values

### 9.3 Export — PDF

**File name:**

- [ ] **RPT-09 Pass** — Download PDF report
- [ ] **RPT-10 Pass** — PDF headers and data are readable and correct

### 9.4 Delete report

- [ ] **RPT-11 Pass** — Delete report for subject (if implemented) — attendance records removed

---

## 10. Role-based access (negative tests)

Forbidden actions must error or be hidden. Do not tick Pass if the action succeeds.

**API endpoint tested:**  
**HTTP status received:**

- [ ] **RBAC-01 Pass** — Teacher → Create section — blocked / hidden
- [ ] **RBAC-02 Pass** — Teacher → Assign teachers to section — blocked
- [ ] **RBAC-03 Pass** — Teacher → Edit section they are not assigned to — 403
- [ ] **RBAC-04 Pass** — Teacher → Create dept admin — hidden
- [ ] **RBAC-05 Pass** — Dept Admin → Create college (desktop) — N/A / blocked
- [ ] **RBAC-06 Pass** — Dept Admin → Manage another department — 403
- [ ] **RBAC-07 Pass** — Super Admin → Platform-only desktop routes behave as designed
- [ ] **RBAC-08 Pass** — Unauthenticated API call (no JWT) — 401

---

## 11. Backend API spot checks (optional)

Use `/docs`, curl, or Postman. Tick Pass only for HTTP 200 (or the documented success code).

- [ ] `GET /health` — 200
- [ ] `POST /api/v1/auth/login` — 200
- [ ] `GET /api/v1/auth/me` — 200 (with JWT)
- [ ] `GET /api/v1/my-sections` — 200 (Teacher)
- [ ] `POST /api/v1/students/enroll` — 200 (Admin / Teacher)
- [ ] `POST /api/v1/recognize` — 200 (Teacher)
- [ ] `POST /api/v1/attendance` — 200 (Teacher)
- [ ] `GET /api/v1/attendance/report/simple-pdf` — 200 (Teacher)
- [ ] `POST /api/v1/subjects/{id}/sections` — 200 (Dept Admin)

**Notes:**

---

## 12. Performance and recognition metrics (optional)

**Test device:**  
**Backend execution provider:** cpu / cuda / coreml

| Metric | Target | Measured |
|--------|--------|----------|
| Feature extraction latency (CPU) | ~45–80 ms/frame | |
| FAISS match latency | Sub-ms | |
| End-to-end photo attendance | under 5 sec user-perceived | |
| Enrollment (3 poses) | Reasonable on device | |
| Report PDF generation | under 10 sec | |

- [ ] Feature extraction latency — **Pass**
- [ ] FAISS match latency — **Pass**
- [ ] End-to-end photo attendance — **Pass**
- [ ] Enrollment (3 poses) — **Pass**
- [ ] Report PDF generation — **Pass**

---

## 13. End-to-end scenario checklist

### Scenario A — Greenfield college (happy path)

- [ ] **A1** Platform admin creates college (desktop)
- [ ] **A2** Platform admin creates super admin (desktop)
- [ ] **A3** Super admin creates department + subjects (desktop or mobile)
- [ ] **A4** Super admin creates dept admin (mobile)
- [ ] **A5** Dept admin creates teacher (mobile)
- [ ] **A6** Dept admin creates Section A and B, assigns teacher (mobile)
- [ ] **A7** Teacher adds students to Section A roster (mobile)
- [ ] **A8** Teacher enrolls a new student with 3 faces (mobile)
- [ ] **A9** Teacher takes photo attendance for Section A (mobile)
- [ ] **A10** Teacher downloads Excel + PDF report (mobile)

**Scenario A result:** Pass / Fail  
**Total time:**  
**Notes:**

### Scenario B — Section conflict

- [ ] **B1** Student is in Section A of Subject X
- [ ] **B2** Attempt to add the same student to Section B → blocked
- [ ] **B3** Remove from A, add to B → succeeds

**Scenario B result:** Pass / Fail  
**Notes:**

### Scenario C — Classroom simulation (scale)

For a large enrollment log, also open an **Enrollment practical test** issue.

- [ ] **C1** ___ students enrolled
- [ ] **C2** Single photo captures ___ faces
- [ ] **C3** Live stream session marks ___ students
- [ ] **C4** False positive count: ___
- [ ] **C5** False negative count: ___

**Scenario C result:** Pass / Fail  
**Notes:**

---

## 14. Bug log

Open a **separate bug issue** per failure. Paste the number/link here.

| Bug issue | Test ID (e.g. SEC-12) | Severity (Blocker / Major / Minor) | Summary | Status |
|-----------|------------------------|--------------------------------------|---------|--------|
| # | | | | Open / Fixed |
| # | | | | |
| # | | | | |
| # | | | | |
| # | | | | |

---

## 15. Test summary scorecard

Fill after the run. Use GitHub’s checklist count at the top as a cross-check.

| Area | Total cases | Passed | Failed | Blocked | N/A | % Pass |
|------|-------------|--------|--------|---------|-----|--------|
| Environment | | | | | | |
| Auth | | | | | | |
| Desktop | | | | | | |
| Dashboard & Profile | | | | | | |
| User management | | | | | | |
| Sections | | | | | | |
| Enrollment | | | | | | |
| Attendance | | | | | | |
| Reports | | | | | | |
| RBAC | | | | | | |
| E2E scenarios | | | | | | |
| **TOTAL** | | | | | | |

### Sign-off

| Role | Name | Date |
|------|------|------|
| Tester | | |
| Reviewer | | |

**Final remarks:**
