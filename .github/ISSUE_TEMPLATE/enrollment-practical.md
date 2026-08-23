---
name: Enrollment practical test
about: Full enrollment & scale workbook — tick Pass, fill actuals as you test
title: "[ENR-TR] Enrollment practical test"
labels: ["test-run"]
---

> **Workbook:** `docs/testing/ENROLLMENT_PRACTICAL_TEST.md` (v1.0)  
> **Purpose:** Hands-on testing of student enrollment at scale — camera flow, 3-pose capture, backend storage, FAISS index, section rosters, and immediate recognition.  
> **How to use:** Fill the session header → complete the preflight → do the single-student walkthrough once → enroll in batches → after every 10 students run the recognition smoke test → finish failure, audit, and sign-off.  
> Tick **Pass** only when the expected result is observed. For a failure, open a separate **bug** issue and paste the link in the bug log at the bottom. GitHub shows checklist progress at the top of this issue.

---

## Test session header

| Field | Value |
|-------|-------|
| **Test run ID** | ENR-TR- |
| **Tester name** | |
| **Date** | |
| **College / Department** | |
| **Subject & Section under test** | |
| **Target enrollment count** | 10 / 25 / 50 / 100 / other: |
| **Device used** | iPhone / Android + model: |
| **Backend URL** | |
| **Overall result** | Pass / Fail / Partial |

---

## 1. Before you start

Do this before the first enrollment. Do not start the batch until every item is ticked.

- [ ] `npm run dev` is running; on the phone, **Test connection** succeeds
- [ ] Logged in as Teacher or Dept Admin — **role:**
- [ ] Subject exists; section created; teacher assigned to that section
- [ ] Lighting is good (no backlight, no harsh shadows on faces)
- [ ] Student `reg_no` list is ready (spreadsheet or printed)
- [ ] Phone storage and battery are enough for a long session
- [ ] Supabase tables `students`, `face_embeddings` and bucket `primary-faces` are reachable for spot checks

**Notes:**

---

## 2. Enrollment scale targets

Fill **Actual enrolled** / **Failed** as you finish each batch. Tick **Pass** when that batch’s target is met (or you stop at a smaller target on purpose — mark N/A in notes).

| Batch | Target | Actual enrolled | Failed | Notes |
|-------|--------|-----------------|--------|-------|
| Batch A (pilot) | 5 | | | |
| Batch B | 10 | | | |
| Batch C | 25 | | | |
| Batch D | 50 | | | |
| Batch E (scale) | 100+ | | | |

- [ ] **Batch A** Pass (pilot of 5)
- [ ] **Batch B** Pass (10)
- [ ] **Batch C** Pass (25)
- [ ] **Batch D** Pass (50)
- [ ] **Batch E** Pass (100+) or N/A — notes:

---

## 3. Single-student walkthrough (do once before the batch)

Enroll **one** student end-to-end. Tick Pass only if the expected result happened.

**Pilot student `reg_no`:**  
**Enrollment time (seconds):**

- [ ] **EPR-01 Pass** — Dashboard → **Enroll Student**
  - **Expected:** Enroll screen opens
  - **Actual:**

- [ ] **EPR-02 Pass** — Step 1: select college / department (if the role shows pickers)
  - **Expected:** Scope matches the logged-in role (teacher/dept admin stay in their own college/dept)
  - **Actual:**

- [ ] **EPR-03 Pass** — Step 2: enter `reg_no` + name
  - **Expected:** Validation passes; can continue
  - **Actual:**

- [ ] **EPR-04 Pass** — Open camera → **Front** pose
  - **Expected:** Face centered; on-screen instruction is clear
  - **Actual:**

- [ ] **EPR-05 Pass** — Capture **Left** (~30°)
  - **Expected:** UI advances to step 2 of 3
  - **Actual:**

- [ ] **EPR-06 Pass** — Capture **Right** (~30°)
  - **Expected:** Submit starts automatically after the third pose
  - **Actual:**

- [ ] **EPR-07 Pass** — Success alert
  - **Expected:** Student enrolled message is shown
  - **Actual:**

- [ ] **EPR-08 Pass** — Open **student-list**
  - **Expected:** Name and `reg_no` are visible
  - **Actual:**

- [ ] **EPR-09 Pass** — Database check
  - **Expected:** 3 rows in `face_embeddings` for this student — poses `front`, `left`, `right`
  - **Actual:**

- [ ] **EPR-10 Pass** — Storage check
  - **Expected:** 3 images in `primary-faces`: `primary.jpg`, `left.jpg`, `right.jpg`
  - **Actual:**

- [ ] **EPR-11 Pass** — Add student to **section roster**
  - **Expected:** Student appears in section-students-list
  - **Actual:**

- [ ] **EPR-12 Pass** — **Take Attendance** photo of this student
  - **Expected:** Student is recognized in the selected section
  - **Actual:** (name match / confidence)

---

## 4. Batch enrollment log

One block per student. After every **10** enrollments, stop and run **Section 6** (recognition smoke test). Copy extra blocks if you go past 25.

<details>
<summary>How to fill a student block</summary>

1. Write `reg_no`, name, start time, duration.
2. Tick the four checks (3 poses, student-list, section, recognized).
3. Tick **Pass** only if all four are true.

</details>

### Student 1
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 2
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 3
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 4
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 5
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 6
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 7
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 8
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 9
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 10
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

> Smoke test now → Section 6 (After 10).

### Student 11
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 12
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 13
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 14
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 15
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 16
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 17
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 18
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 19
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 20
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

> Smoke test now → Section 6 (After 20).

### Student 21
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 22
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 23
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 24
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

### Student 25
- `reg_no` / name:  
- Start / duration (s):  
- [ ] 3 poses OK
- [ ] In student-list
- [ ] Section added
- [ ] Recognized
- [ ] **Pass**

Need more rows? Duplicate a student block in a comment, or edit this issue and paste extra `### Student N` blocks.

---

## 5. Role and permission checks

Log in as each role (or skip with **N/A** in Actual if you cannot use that account this session).

- [ ] **EPR-R01 Pass** — Role: **TEACHER**
  - **Expected:** Can open Enroll. College picker hidden (own college). Department = own dept only.
  - **Actual:**

- [ ] **EPR-R02 Pass** — Role: **DEPARTMENT_ADMIN**
  - **Expected:** Can open Enroll. College picker hidden. Own department only.
  - **Actual:**

- [ ] **EPR-R03 Pass** — Role: **SUPER_ADMIN**
  - **Expected:** Can open Enroll. Can pick college. Any department in that college.
  - **Actual:**

- [ ] **EPR-R04 Pass** — Role: **PLATFORM_ADMIN**
  - **Expected:** Can open Enroll on mobile. Can pick college. Scope as configured.
  - **Actual:**

- [ ] **EPR-R05 Pass** — Role: **teacher from a different department**
  - **Expected:** Cannot enroll into another department (blocked in UI or 403).
  - **Actual:**

---

## 6. Post-batch recognition smoke test

After every 10 enrollments, pick **3 random** students already in the section. Take attendance (photo). Tick Pass only if name match is correct **and** confidence is above threshold.

**Recognition threshold used:** (default 0.5 unless changed)

### After 10
- Random `reg_no` 1:  
- Random `reg_no` 2:  
- Random `reg_no` 3:  
- Section selected:  
- [ ] Name match correct for all 3
- [ ] Confidence above threshold for all 3
- [ ] **Pass**

### After 20
- Random `reg_no` 1:  
- Random `reg_no` 2:  
- Random `reg_no` 3:  
- Section selected:  
- [ ] Name match correct for all 3
- [ ] Confidence above threshold for all 3
- [ ] **Pass**

### After 30
- Random `reg_no` 1:  
- Random `reg_no` 2:  
- Random `reg_no` 3:  
- Section selected:  
- [ ] Name match correct for all 3
- [ ] Confidence above threshold for all 3
- [ ] **Pass**

### After 50
- Random `reg_no` 1:  
- Random `reg_no` 2:  
- Random `reg_no` 3:  
- Section selected:  
- [ ] Name match correct for all 3
- [ ] Confidence above threshold for all 3
- [ ] **Pass**

---

## 7. Practical failure scenarios

- [ ] **EPR-F01 Pass** — No face in front photo
  - **Steps:** Cover the face (or point away), capture front.
  - **Expected:** Error **before** submit; student is not created.
  - **Actual:**

- [ ] **EPR-F02 Pass** — Missing left/right pose
  - **Steps:** Capture front, skip turning, try to submit.
  - **Expected:** Blocked or error; cannot enroll with only one pose.
  - **Actual:**

- [ ] **EPR-F03 Pass** — Duplicate `reg_no`
  - **Steps:** Enroll again with a `reg_no` that already exists.
  - **Expected:** API error shown in the app; no second student.
  - **Actual:**

- [ ] **EPR-F04 Pass** — Network drop mid-submit
  - **Steps:** Capture all 3 poses, turn on Airplane Mode, submit, then restore network.
  - **Expected:** Error shown; no partial student (no row with missing images/embeddings).
  - **Actual:**

- [ ] **EPR-F05 Pass** — Retry after failure
  - **Steps:** After a failed enroll, recapture all 3 poses and submit again.
  - **Expected:** Success on the second attempt.
  - **Actual:**

- [ ] **EPR-F06 Pass** — Poor lighting
  - **Steps:** Enroll in a dim room.
  - **Expected:** Face detect fails or a clear warning. Record what happened.
  - **Actual:**

- [ ] **EPR-F07 Pass** — Glasses / cap
  - **Steps:** Enroll with glasses or a cap. Then try recognition.
  - **Expected:** Enrollment may succeed; record whether recognition still matches.
  - **Actual:** (recognized? Y/N, confidence)

- [ ] **EPR-F08 Pass** — Two people in frame
  - **Steps:** Extra face in the background during capture.
  - **Expected:** Best face is selected, **or** the app fails clearly (not a silent wrong person).
  - **Actual:**

---

## 8. Edit student and add face (after enrollment)

Use an already enrolled student.

**Student `reg_no` used:**

- [ ] **EPR-E01 Pass** — Edit name / `reg_no`
  - **Expected:** Saved in the UI and in the database.
  - **Actual:**

- [ ] **EPR-E02 Pass** — Add face — update **left**
  - **Expected:** New `left.jpg` and left embedding replace the old ones.
  - **Actual:**

- [ ] **EPR-E03 Pass** — Add face — update **right**
  - **Expected:** New `right.jpg` and right embedding replace the old ones.
  - **Actual:**

- [ ] **EPR-E04 Pass** — Recognition after re-capture
  - **Expected:** Student still matches correctly in Take Attendance.
  - **Actual:** (confidence)

---

## 9. Performance log

Fill measured values. Tick Pass if the batch meets the target.

| Metric | Target | Batch A | Batch B | Batch C |
|--------|--------|---------|---------|---------|
| Avg enrollment time (sec/student) | under 60 | | | |
| Face detection fail rate | under 5% | | | |
| API error rate | under 2% | | | |
| Recognition success (smoke test) | 100% of sampled | | | |
| FAISS refresh (no restart) | Immediate | | | |

- [ ] Avg enrollment time — **Pass**
- [ ] Face detection fail rate — **Pass**
- [ ] API error rate — **Pass**
- [ ] Recognition success — **Pass**
- [ ] FAISS refresh immediate (recognition works without restarting backend) — **Pass**

---

## 10. Scale scenario — full classroom simulation

- [ ] **S1 Pass** — Enroll ___ students into one department
- [ ] **S2 Pass** — Add all to Section ___ roster
- [ ] **S3 Pass** — Single-photo attendance: ___ faces detected
- [ ] **S4 Pass** — Live stream session: ___ students marked present
- [ ] **S5** — False positives: ___ | False negatives: ___
- [ ] **S6 Pass** — Export Excel + PDF; counts match enrolled / present students

**Scenario result:** Pass / Fail  
**Total session time:**

---

## 11. Data integrity audit (sample 10 students)

Pick 10 enrolled students. For each: 3 embeddings, 3 storage URLs, in section, recognized.

### Audit 1 — `reg_no`:
- [ ] 3 embeddings
- [ ] 3 storage URLs
- [ ] In section
- [ ] Recognized
- [ ] **Pass**

### Audit 2 — `reg_no`:
- [ ] 3 embeddings
- [ ] 3 storage URLs
- [ ] In section
- [ ] Recognized
- [ ] **Pass**

### Audit 3 — `reg_no`:
- [ ] 3 embeddings
- [ ] 3 storage URLs
- [ ] In section
- [ ] Recognized
- [ ] **Pass**

### Audit 4 — `reg_no`:
- [ ] 3 embeddings
- [ ] 3 storage URLs
- [ ] In section
- [ ] Recognized
- [ ] **Pass**

### Audit 5 — `reg_no`:
- [ ] 3 embeddings
- [ ] 3 storage URLs
- [ ] In section
- [ ] Recognized
- [ ] **Pass**

### Audit 6 — `reg_no`:
- [ ] 3 embeddings
- [ ] 3 storage URLs
- [ ] In section
- [ ] Recognized
- [ ] **Pass**

### Audit 7 — `reg_no`:
- [ ] 3 embeddings
- [ ] 3 storage URLs
- [ ] In section
- [ ] Recognized
- [ ] **Pass**

### Audit 8 — `reg_no`:
- [ ] 3 embeddings
- [ ] 3 storage URLs
- [ ] In section
- [ ] Recognized
- [ ] **Pass**

### Audit 9 — `reg_no`:
- [ ] 3 embeddings
- [ ] 3 storage URLs
- [ ] In section
- [ ] Recognized
- [ ] **Pass**

### Audit 10 — `reg_no`:
- [ ] 3 embeddings
- [ ] 3 storage URLs
- [ ] In section
- [ ] Recognized
- [ ] **Pass**

---

## 12. Bug log

Open a **separate bug issue** per failure. Paste the link here.

| Bug issue | Test ID (e.g. EPR-F03) | Severity (Blocker / Major / Minor) | Summary | Status |
|-----------|------------------------|--------------------------------------|---------|--------|
| # | | | | Open / Fixed |
| # | | | | |
| # | | | | |

---

## 13. Sign-off

| Role | Name | Date |
|------|------|------|
| Tester | | |
| Reviewer | | |

**Final remarks:**
