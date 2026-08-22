# Attend — Manual Test Plan & Execution Workbook

> **Purpose:** End-to-end manual testing of all Attend features across Platform Admin, Super Admin, Department Admin, and Teacher roles (Mobile + Desktop + Backend).  
> **How to use:** Fill in the session header, work through each section, check `[x]` when verified, and record actual values in the blank fields.

---

## Test Session Header

| Field | Value |
|-------|-------|
| **Test run ID** | TR-____________ |
| **Tester name** | |
| **Date** | |
| **Start time** | |
| **End time** | |
| **Git commit / branch** | |
| **Backend URL** | e.g. `http://10.x.x.x:8000` |
| **Mobile device** | e.g. iPhone / Android + OS version |
| **Desktop OS** | e.g. macOS / Windows |
| **Network** | Same WiFi? Y / N |
| **Supabase project** | |
| **Overall result** | Pass / Fail / Partial |

---

## 1. Environment & Preflight

### 1.1 Services running

- [ ] `npm run dev` starts without errors (Turbo TUI)
- [ ] Backend health: `GET /health` returns `{"status":"ok"}`
- [ ] Backend docs load: `/docs`
- [ ] Mobile Expo bundle loads (Android/iOS)
- [ ] Admin desktop Electron window opens
- [ ] Shared package `tsc --watch` running (no errors)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Backend port | `0.0.0.0:8000` | | [ ] |
| API_BASE on mobile (login → Test connection) | Reachable | | [ ] |
| Desktop `VITE_API_URL` | Points to backend | | [ ] |

**Notes:** _______________________________________________

### 1.2 Test accounts (fill before testing)

| Email | Password | Role | College | Department | Notes |
|-------|----------|------|---------|------------|-------|
| | | PLATFORM_ADMIN | | | |
| | | SUPER_ADMIN | | | |
| | | DEPARTMENT_ADMIN | | | |
| | | TEACHER | | | |

### 1.3 Seed test data (fill as created)

| Entity | Name / ID | Notes |
|--------|-----------|-------|
| College | | |
| Department | | |
| Subject 1 | | |
| Subject 2 | | |
| Section A (Subject 1) | | |
| Section B (Subject 1) | | |
| Teacher (assigned Section A) | | |
| Student S1 (Section A) | reg_no: | |
| Student S2 (Section A) | reg_no: | |
| Student S3 (Section B) | reg_no: | |

---

## 2. Authentication & Connection

### 2.1 Mobile — Login screen

| ID | Test case | Steps | Expected | Pass [ ] |
|----|-----------|-------|----------|----------|
| AUTH-M-01 | Test connection | Tap **Test connection** | Alert: Connection OK, `/health` response | [ ] |
| AUTH-M-02 | Valid login | Enter valid credentials → Login | Redirect to Dashboard / profile-edit if incomplete | [ ] |
| AUTH-M-03 | Invalid password | Wrong password | Error: Login Failed | [ ] |
| AUTH-M-04 | Invalid email format | Bad email | Validation error | [ ] |
| AUTH-M-05 | Unverified email | Login before verify | Redirect to verify-email | [ ] |
| AUTH-M-06 | Logout | Profile → sign out (if available) or token clear | Returns to login | [ ] |

**Actual API_BASE used:** _______________  
**Login response time (ms):** _______________  
**Notes:** _______________________________________________

### 2.2 Mobile — Sign up & verify

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| AUTH-M-07 | Sign up new user | Account created, verify prompt | [ ] |
| AUTH-M-08 | Verify email link | Email link opens, account verified | [ ] |
| AUTH-M-09 | Resend verification | Resend succeeds | [ ] |

**Test email used:** _______________  
**Notes:** _______________________________________________

### 2.3 Desktop — Login

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| AUTH-D-01 | Platform admin login | Dashboard loads | [ ] |
| AUTH-D-02 | Invalid credentials | Error shown | [ ] |
| AUTH-D-03 | Sign out | Returns to login, protected routes blocked | [ ] |
| AUTH-D-04 | Unauthenticated access | Navigate to `/colleges` without token | Redirect to login | [ ] |

**Notes:** _______________________________________________

---

## 3. Desktop App — Platform Admin

### 3.1 Dashboard

- [ ] Dashboard loads after login
- [ ] Navigation sidebar visible (Dashboard, Colleges)
- [ ] Sign Out works

**Notes:** _______________________________________________

### 3.2 Colleges

| ID | Test case | Steps | Expected | Pass [ ] |
|----|-----------|-------|----------|----------|
| DESK-01 | List colleges | Colleges page | All colleges listed | [ ] |
| DESK-02 | Create college | Create College → submit name | College appears in list | [ ] |
| DESK-03 | Edit college | Edit name / details | Changes saved | [ ] |
| DESK-04 | Upload college logo | Upload logo (if UI present) | Logo URL stored, displays | [ ] |
| DESK-05 | View college detail | Open college | Detail page loads | [ ] |

**College created name:** _______________  
**College ID:** _______________  
**Notes:** _______________________________________________

### 3.3 Super Admin creation (per college)

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| DESK-06 | Create super admin | User created with SUPER_ADMIN role | [ ] |
| DESK-07 | Super admin can login mobile | New super admin logs in on mobile | [ ] |

**Super admin email created:** _______________  
**Notes:** _______________________________________________

### 3.4 Departments (per college)

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| DESK-08 | List departments | Departments for college shown | [ ] |
| DESK-09 | Create department | New department saved | [ ] |
| DESK-10 | Delete department | Department removed (if allowed) | [ ] |

**Department name:** _______________  
**Department ID:** _______________  
**Notes:** _______________________________________________

### 3.5 Users (per college)

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| DESK-11 | List users | Users filtered by college | [ ] |
| DESK-12 | Create user (dept admin) | User with DEPARTMENT_ADMIN role | [ ] |
| DESK-13 | Create user (teacher) | User with TEACHER role | [ ] |
| DESK-14 | Delete user | User removed | [ ] |

**Notes:** _______________________________________________

### 3.6 Subjects (per department)

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| DESK-15 | List subjects | Subjects for department shown | [ ] |
| DESK-16 | Create subject | Subject saved | [ ] |
| DESK-17 | Edit subject | Name updated | [ ] |
| DESK-18 | Delete subject | Subject removed | [ ] |
| DESK-19 | Enroll students to subject | Students linked via subject_students | [ ] |

**Subject 1 name:** _______________  
**Subject 2 name:** _______________  
**Notes:** _______________________________________________

### 3.7 Students view (desktop)

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| DESK-20 | List students | Students by college/dept visible | [ ] |
| DESK-21 | Student detail | reg_no, name, image URLs shown | [ ] |

**Notes:** _______________________________________________

---

## 4. Mobile — Dashboard & Profile

### 4.1 Dashboard (all staff roles)

| ID | Role | Quick action visible | Route works | Pass [ ] |
|----|------|---------------------|-------------|----------|
| DASH-01 | All | Take Attendance | attendance | [ ] |
| DASH-02 | All | Enroll Student | enroll | [ ] |
| DASH-03 | All | View Reports | reports | [ ] |
| DASH-04 | Super / Dept | My department (Department Hub) | department-hub | [ ] |
| DASH-05 | Super only | Create Department Admin | create-department-admin | [ ] |
| DASH-06 | Teacher | Section Students | section-students | [ ] |

**Notes:** _______________________________________________

### 4.2 Profile

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| PROF-01 | Profile screen loads | Name, email, role displayed | [ ] |
| PROF-02 | Profile card | Full profile view | [ ] |
| PROF-03 | Profile edit — name | Name saved via API | [ ] |
| PROF-04 | Profile edit — contact | Contact number saved | [ ] |
| PROF-05 | Incomplete profile redirect | Missing name/contact → profile-edit on login | [ ] |

**Updated name:** _______________  
**Updated contact:** _______________  
**Notes:** _______________________________________________

---

## 5. Mobile — User Management

### 5.1 Super Admin — Create Department Admin

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| USER-01 | Open Create Dept Admin | Form loads | [ ] |
| USER-02 | Create with valid data | User created, can login | [ ] |
| USER-03 | Duplicate email | Error returned | [ ] |
| USER-04 | Missing required fields | Validation error | [ ] |

**Created dept admin email:** _______________  
**Notes:** _______________________________________________

### 5.2 Department Admin — Create Teacher

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| USER-05 | Open Add Teacher | Form loads | [ ] |
| USER-06 | Create teacher | TEACHER role user created | [ ] |
| USER-07 | Teacher login | New teacher can login mobile | [ ] |

**Created teacher email:** _______________  
**Notes:** _______________________________________________

### 5.3 Department Hub navigation

| ID | Link | Loads | Pass [ ] |
|----|------|-------|----------|
| HUB-01 | View Students | student-list | [ ] |
| HUB-02 | View Teachers | teacher-list | [ ] |
| HUB-03 | Section Students | section-students | [ ] |
| HUB-04 | Manage Sections | manage-sections | [ ] |
| HUB-05 | Add Teacher | create-teacher | [ ] |

**Notes:** _______________________________________________

### 5.4 Student list & teacher list

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| LIST-01 | Student list shows dept students | Names, reg_no visible | [ ] |
| LIST-02 | Tap student → edit student | edit-student screen | [ ] |
| LIST-03 | Teacher list shows dept teachers | Names, emails visible | [ ] |

**Notes:** _______________________________________________

---

## 6. Section Management

### 6.1 Department Admin — Create & manage sections

| ID | Test case | Steps | Expected | Pass [ ] |
|----|-----------|-------|----------|----------|
| SEC-01 | Open Manage Sections | Select subject | Section list for subject | [ ] |
| SEC-02 | Create Section A | Name `A` | Section created (uppercase) | [ ] |
| SEC-03 | Create Section B | Name `B` | Second section created | [ ] |
| SEC-04 | Duplicate section name | Create `A` again | Error: name exists | [ ] |
| SEC-05 | Assign teacher to Section A | Checkbox modal → Save | Teacher listed on section | [ ] |
| SEC-06 | Assign multiple teachers | Two teachers on one section | Both shown | [ ] |
| SEC-07 | Remove teacher from section | Delete assignment | Teacher removed | [ ] |
| SEC-08 | Delete section | Confirm delete | Section removed | [ ] |

**Section A ID:** _______________  
**Section B ID:** _______________  
**Teacher assigned:** _______________  
**Notes:** _______________________________________________

### 6.2 Teacher / Admin — Section student roster

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| SEC-09 | My Sections lists assigned subjects | Only assigned sections visible (teacher) | [ ] |
| SEC-10 | Open section student list | section-students-list loads | [ ] |
| SEC-11 | Edit mode → Add students | Multi-select → Add | Students appear in roster | [ ] |
| SEC-12 | Add student already in Section B (same subject) | Blocked | Error: one section per subject | [ ] |
| SEC-13 | Remove student from section | Edit → remove | Student removed from roster | [ ] |
| SEC-14 | Teacher not assigned to section | Cannot edit roster | 403 or UI blocked | [ ] |

**Students added to Section A:** _______________  
**Conflict test student:** _______________  
**Error message received:** _______________  
**Notes:** _______________________________________________

---

## 7. Student Enrollment

### 7.1 Enroll new student (3 face poses)

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| ENR-01 | Step 1 — enter reg_no, name | Validation passes | [ ] |
| ENR-02 | Select college (super admin) | College picker works | [ ] |
| ENR-03 | Select department | Department picker works | [ ] |
| ENR-04 | Proceed to camera | enroll-camera opens | [ ] |
| ENR-05 | Capture front face | Face detected | [ ] |
| ENR-06 | Capture left face | Face detected | [ ] |
| ENR-07 | Capture right face | Face detected | [ ] |
| ENR-08 | Submit enrollment | Student created in DB | [ ] |
| ENR-09 | Embeddings stored | 3 embeddings (front/left/right) | [ ] |
| ENR-10 | Images in storage | primary-faces bucket paths | [ ] |
| ENR-11 | FAISS cache invalidated | Recognition works immediately | [ ] |

**Student reg_no:** _______________  
**Student name:** _______________  
**Student ID:** _______________  
**Enrollment time (sec):** _______________  
**Notes:** _______________________________________________

### 7.2 Enrollment — negative cases

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| ENR-12 | No face in front image | Error: no face detected | [ ] |
| ENR-13 | Missing left/right pose | Error before submit | [ ] |
| ENR-14 | Duplicate reg_no | Error from API | [ ] |

**Notes:** _______________________________________________

### 7.3 Edit student & add face

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| ENR-15 | Edit student name/reg | Saved | [ ] |
| ENR-16 | Add face camera — update left | New embedding + image | [ ] |
| ENR-17 | Add face camera — update right | New embedding + image | [ ] |
| ENR-18 | Delete student (if UI exists) | Student removed | [ ] |

**Notes:** _______________________________________________

---

## 8. Attendance & Face Recognition

### 8.1 Attendance setup

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| ATT-01 | Teacher with no sections | Empty state message | [ ] |
| ATT-02 | Select subject | Sections list updates | [ ] |
| ATT-03 | Select section | Start enabled | [ ] |
| ATT-04 | Super admin test recognition button | test_mode camera (if visible) | [ ] |

**Subject selected:** _______________  
**Section selected:** _______________  
**Notes:** _______________________________________________

### 8.2 Single-photo attendance

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| ATT-05 | Capture photo with enrolled student | Match shown with name, reg_no | [ ] |
| ATT-06 | Confidence score displayed | Score > threshold (record below) | [ ] |
| ATT-07 | Reference image shown | primary_image_url loads | [ ] |
| ATT-08 | Face crop preview | Bounding box / crop visible | [ ] |
| ATT-09 | Confirm & save | Attendance record created | [ ] |
| ATT-10 | Reject / skip unknown | No record saved for unknown | [ ] |

| Field | Value |
|-------|-------|
| Student matched | |
| Confidence score | |
| Recognition latency (approx) | |
| attendance_id (after save) | |
| face_crop_url | |

**Notes:** _______________________________________________

### 8.3 Live stream attendance

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| ATT-11 | Start live session | Stream session started | [ ] |
| ATT-12 | Frame 1 — student recognized | Match appears | [ ] |
| ATT-13 | Same student in frame 2 | Dedup — not double-counted | [ ] |
| ATT-14 | Multiple students in frame | Multiple matches | [ ] |
| ATT-15 | Confirm batch save | All accepted records saved | [ ] |
| ATT-16 | End stream session | Session cleared | [ ] |

**Session ID:** _______________  
**Students marked present:** _______________  
**Notes:** _______________________________________________

### 8.4 Recognition edge cases

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| ATT-17 | Unknown person (not enrolled) | Shown as unknown | [ ] |
| ATT-18 | Enrolled student NOT in section roster | Treated as unknown | [ ] |
| ATT-19 | Student in college, wrong section | No match / unknown for section scope | [ ] |
| ATT-20 | Poor lighting / angle | Degraded or no match (record behavior) | [ ] |
| ATT-21 | No face in frame | No matches or empty results | [ ] |
| ATT-22 | Super admin test mode (`/recognize/test`) | Matches across college (no subject filter) | [ ] |

| Edge case | Expected behavior | Actual behavior | Pass [ ] |
|-----------|-------------------|-----------------|----------|
| Unknown face | unknown: true | | [ ] |
| Out-of-section enrolled | unknown / filtered | | [ ] |
| Low confidence | Below threshold → unknown | | [ ] |

**Notes:** _______________________________________________

### 8.5 Attendance record verification (backend / reports)

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| ATT-23 | Record has student_id | Correct student | [ ] |
| ATT-24 | Record has subject_id | Correct subject | [ ] |
| ATT-25 | Record has section_id | Correct section | [ ] |
| ATT-26 | Record has attendance_date | Today's date | [ ] |
| ATT-27 | Record has confidence | Matches UI score | [ ] |
| ATT-28 | Record has face_crop_url | URL accessible | [ ] |
| ATT-29 | Delete attendance record (if UI) | Record removed | [ ] |

**Sample record JSON / ID:** _______________________________________________

---

## 9. Reports & Exports

### 9.1 Reports list

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| RPT-01 | Empty state (no attendance) | "No reports yet" message | [ ] |
| RPT-02 | Subject with attendance appears | Listed on reports screen | [ ] |
| RPT-03 | Open reports detail | Records for subject shown | [ ] |
| RPT-04 | Filter by section (if UI) | Section-scoped records | [ ] |
| RPT-05 | Attendance record detail | Single record view | [ ] |

**Subject tested:** _______________  
**Record count shown:** _______________  
**Notes:** _______________________________________________

### 9.2 Export — Excel

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| RPT-06 | Download Excel report | File downloads / shares | [ ] |
| RPT-07 | Excel contains correct students | Names, dates match UI | [ ] |
| RPT-08 | Excel contains confidence values | Column populated | [ ] |

**File name:** _______________  
**Row count:** _______________  
**Notes:** _______________________________________________

### 9.3 Export — PDF

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| RPT-09 | Download PDF report | File downloads / shares | [ ] |
| RPT-10 | PDF formatting readable | Headers, data correct | [ ] |

**File name:** _______________  
**Notes:** _______________________________________________

### 9.4 Delete report (subject-level)

| ID | Test case | Expected | Pass [ ] |
|----|-----------|----------|----------|
| RPT-11 | Delete report for subject | Attendance records removed (if implemented) | [ ] |

**Notes:** _______________________________________________

---

## 10. Role-Based Access Control (Negative Tests)

> Verify forbidden actions return errors or UI is hidden.

| ID | Role | Action attempted | Expected | Pass [ ] |
|----|------|------------------|----------|----------|
| RBAC-01 | Teacher | Create section | Blocked / hidden | [ ] |
| RBAC-02 | Teacher | Assign teachers to section | Blocked | [ ] |
| RBAC-03 | Teacher | Edit section not assigned | 403 | [ ] |
| RBAC-04 | Teacher | Create dept admin | Hidden | [ ] |
| RBAC-05 | Dept Admin | Create college (desktop) | N/A / blocked | [ ] |
| RBAC-06 | Dept Admin | Manage other department | 403 | [ ] |
| RBAC-07 | Super Admin | Platform-only desktop routes | As designed | [ ] |
| RBAC-08 | Unauthenticated | API call without JWT | 401 | [ ] |

**API endpoint tested:** _______________  
**HTTP status received:** _______________  
**Notes:** _______________________________________________

---

## 11. Backend API Spot Checks (Optional)

> Use `/docs` or curl/Postman to verify critical endpoints.

| Endpoint | Method | Role | Status code | Pass [ ] |
|----------|--------|------|-------------|----------|
| `/health` | GET | — | 200 | [ ] |
| `/api/v1/auth/login` | POST | — | 200 | [ ] |
| `/api/v1/auth/me` | GET | JWT | 200 | [ ] |
| `/api/v1/my-sections` | GET | Teacher | 200 | [ ] |
| `/api/v1/students/enroll` | POST | Admin | 200 | [ ] |
| `/api/v1/recognize` | POST | Teacher | 200 | [ ] |
| `/api/v1/attendance` | POST | Teacher | 200 | [ ] |
| `/api/v1/attendance/report/simple-pdf` | GET | Teacher | 200 | [ ] |
| `/api/v1/subjects/{id}/sections` | POST | Dept Admin | 200 | [ ] |

**Notes:** _______________________________________________

---

## 12. Performance & Recognition Metrics (Optional)

| Metric | Target | Measured | Pass [ ] |
|--------|--------|----------|----------|
| Feature extraction latency (CPU) | ~45–80 ms/frame | | [ ] |
| FAISS match latency | Sub-ms | | [ ] |
| End-to-end photo attendance | < 5 sec user-perceived | | [ ] |
| Enrollment (3 poses) | Reasonable on device | | [ ] |
| Report PDF generation | < 10 sec | | [ ] |

**Test device:** _______________  
**Backend execution provider:** cpu / cuda / coreml  
**Notes:** _______________________________________________

---

## 13. End-to-End Scenario Checklist

### Scenario A — Greenfield college (full happy path)

- [ ] A1. Platform admin creates college (desktop)
- [ ] A2. Platform admin creates super admin (desktop)
- [ ] A3. Super admin creates department + subjects (desktop or mobile)
- [ ] A4. Super admin creates dept admin (mobile)
- [ ] A5. Dept admin creates teacher (mobile)
- [ ] A6. Dept admin creates Section A & B, assigns teacher (mobile)
- [ ] A7. Teacher adds students to Section A roster (mobile)
- [ ] A8. Teacher enrolls new student with 3 faces (mobile)
- [ ] A9. Teacher takes photo attendance for Section A (mobile)
- [ ] A10. Teacher downloads Excel + PDF report (mobile)

**Scenario A result:** Pass / Fail  
**Total time:** _______________  
**Notes:** _______________________________________________

### Scenario B — Section conflict

- [ ] B1. Student in Section A of Subject X
- [ ] B2. Attempt add same student to Section B → blocked
- [ ] B3. Remove from A, add to B → succeeds

**Scenario B result:** Pass / Fail  
**Notes:** _______________________________________________

### Scenario C — Classroom simulation (scale)

- [ ] C1. ___ students enrolled
- [ ] C2. Single photo captures ___ faces
- [ ] C3. Live stream session marks ___ students
- [ ] C4. False positive count: ___
- [ ] C5. False negative count: ___

**Scenario C result:** Pass / Fail  
**Notes:** _______________________________________________

---

## 14. Bug Log

| Bug ID | TC ID | Severity | Summary | Steps | Expected | Actual | Status |
|--------|-------|----------|---------|-------|----------|--------|--------|
| BUG-001 | | Blocker/Major/Minor | | | | | Open/Fixed |
| BUG-002 | | | | | | | |
| BUG-003 | | | | | | | |
| BUG-004 | | | | | | | |
| BUG-005 | | | | | | | |

---

## 15. Test Summary Scorecard

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

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tester | | | |
| Reviewer | | | |

### Final remarks

_______________________________________________  
_______________________________________________  
_______________________________________________

---

*Document version: 1.0 — aligned with Attend v1.0.0 feature set.*
