# Attend — Practical Enrollment & Scale Test Workbook

> **Purpose:** Hands-on testing of student enrollment at scale — camera flow, 3-pose capture, backend storage, FAISS index, section rosters, and immediate recognition.  
> **Audience:** Teachers, Department Admins, Super Admins running real enrollment sessions.  
> **How to use:** Set scale targets (10 / 25 / 50 / 100+), log each student in the batch tables, verify after each batch, then run recognition smoke tests.

---

## Test Session Header

| Field | Value |
|-------|-------|
| **Test run ID** | ENR-TR-____________ |
| **Tester name** | |
| **Date** | |
| **College / Department** | |
| **Subject & Section under test** | |
| **Target enrollment count** | 10 / 25 / 50 / 100 / other: ___ |
| **Device used** | iPhone / Android + model |
| **Backend URL** | |
| **Overall result** | Pass / Fail / Partial |

---

## 1. Before You Start (Practical Checklist)

- [ ] `npm run dev` running; mobile connects to backend (`Test connection` OK)
- [ ] Logged in as Teacher or Dept Admin (role: ____________)
- [ ] Subject exists; section created; teacher assigned to section
- [ ] Good lighting in enrollment area (avoid backlight / harsh shadows)
- [ ] Student reg_no list prepared (spreadsheet or printed list)
- [ ] Phone storage & battery sufficient for batch session
- [ ] Supabase `students`, `face_embeddings`, `primary-faces` bucket accessible for spot checks

---

## 2. Enrollment Scale Targets

| Batch | Target count | Actual enrolled | Failed | Notes |
|-------|--------------|-----------------|--------|-------|
| Batch A (pilot) | 5 | | | |
| Batch B | 10 | | | |
| Batch C | 25 | | | |
| Batch D | 50 | | | |
| Batch E (scale) | 100+ | | | |

---

## 3. Single-Student Walkthrough (Do Once Before Batch)

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| EPR-01 | Dashboard → **Enroll Student** | enroll screen opens | [ ] |
| EPR-02 | Step 1: select college/dept (if applicable) | Correct scope for role | [ ] |
| EPR-03 | Step 2: enter reg_no + name | Validation passes | [ ] |
| EPR-04 | Open camera → **Front** pose | Face centered, instruction clear | [ ] |
| EPR-05 | Capture **Left** (~30°) | Step 2 of 3 advances | [ ] |
| EPR-06 | Capture **Right** (~30°) | Submit starts automatically | [ ] |
| EPR-07 | Success alert | Student enrolled message | [ ] |
| EPR-08 | Student in **student-list** | Name + reg_no visible | [ ] |
| EPR-09 | DB: 3 rows in `face_embeddings` | front, left, right poses | [ ] |
| EPR-10 | Storage: 3 images in bucket | primary.jpg, left.jpg, right.jpg | [ ] |
| EPR-11 | Add student to **section roster** | Appears in section-students-list | [ ] |
| EPR-12 | **Take Attendance** photo test | Student recognized in section | [ ] |

**Pilot student reg_no:** ____________  
**Enrollment time (sec):** ____________

---

## 4. Batch Enrollment Log

Use one row per student. Run recognition smoke test (Section 6) after each batch of 10.

| # | reg_no | name | Start | Duration (s) | 3 poses OK | In student-list | Section added | Recognized | Pass |
|---|--------|------|-------|--------------|------------|-----------------|---------------|------------|------|
| 1 | | | | | [ ] | [ ] | [ ] | [ ] | [ ] |
| … | | | | | | | | | |
| 50 | | | | | | | | | |

*(PDF version includes 50 pre-numbered rows.)*

---

## 5. Role & Permission Checks

| ID | Role | Can open Enroll? | College picker | Dept scope | Pass |
|----|------|------------------|----------------|------------|------|
| EPR-R01 | TEACHER | Yes | Hidden (own college) | Own dept | [ ] |
| EPR-R02 | DEPARTMENT_ADMIN | Yes | Hidden | Own dept | [ ] |
| EPR-R03 | SUPER_ADMIN | Yes | Can pick college | Any dept in college | [ ] |
| EPR-R04 | PLATFORM_ADMIN | Yes (mobile) | Can pick college | As configured | [ ] |
| EPR-R05 | Wrong dept teacher | N/A | — | Cannot enroll other dept | [ ] |

---

## 6. Post-Batch Recognition Smoke Test

After every 10 enrollments, pick **3 random** enrolled students and verify recognition.

| Batch # | Student reg_no (random) | Section selected | Match name correct | Confidence > threshold | Pass |
|---------|---------------------------|------------------|--------------------|------------------------|------|
| After 10 | | | [ ] | [ ] | [ ] |
| After 20 | | | [ ] | [ ] | [ ] |
| After 30 | | | [ ] | [ ] | [ ] |
| After 50 | | | [ ] | [ ] | [ ] |

---

## 7. Practical Failure Scenarios

| ID | Scenario | Steps | Expected | Pass |
|----|----------|-------|----------|------|
| EPR-F01 | No face in front photo | Cover face, capture | Error before submit | [ ] |
| EPR-F02 | Missing left/right pose | Skip turn, try submit | Blocked / error | [ ] |
| EPR-F03 | Duplicate reg_no | Re-enroll same reg_no | API error shown | [ ] |
| EPR-F04 | Network drop mid-submit | Airplane mode on submit | Error; no partial student | [ ] |
| EPR-F05 | Retry after failure | Re-capture all 3 poses | Success on second attempt | [ ] |
| EPR-F06 | Poor lighting | Dim room enrollment | Face detect fail or warn | [ ] |
| EPR-F07 | Glasses / cap | Enroll with accessories | Record if recognition still OK | [ ] |
| EPR-F08 | Two people in frame | Extra face in background | Best face selected or fail clearly | [ ] |

---

## 8. Edit Student & Add Face (Post-Enrollment)

| ID | Test | Expected | Pass |
|----|------|----------|------|
| EPR-E01 | Edit name / reg_no | Saved in DB + UI | [ ] |
| EPR-E02 | Add face — update left | New left.jpg + embedding | [ ] |
| EPR-E03 | Add face — update right | New right.jpg + embedding | [ ] |
| EPR-E04 | Recognition after re-capture | Still matches correctly | [ ] |

---

## 9. Performance Log (Practical)

| Metric | Target | Batch A | Batch B | Batch C | Pass |
|--------|--------|---------|---------|---------|------|
| Avg enrollment time (sec/student) | < 60 | | | | [ ] |
| Face detection fail rate | < 5% | | | | [ ] |
| API error rate | < 2% | | | | [ ] |
| Recognition success (smoke test) | 100% of sampled | | | | [ ] |
| FAISS refresh (no restart needed) | Immediate | | | | [ ] |

---

## 10. Scale Scenario — Full Classroom Simulation

- [ ] S1. Enroll ___ students into one department
- [ ] S2. Add all to Section ___ roster
- [ ] S3. Single-photo attendance: ___ faces detected
- [ ] S4. Live stream session: ___ students marked present
- [ ] S5. False positives: ___ | False negatives: ___
- [ ] S6. Export report (Excel + PDF) matches enrolled count

**Scenario result:** Pass / Fail  
**Total session time:** ____________

---

## 11. Data Integrity Audit (Sample 10 Students)

| reg_no | 3 embeddings? | 3 storage URLs? | In section? | Recognized? | Pass |
|--------|---------------|-----------------|---------------|-------------|------|
| | [ ] | [ ] | [ ] | [ ] | [ ] |
| *(repeat for 10 samples)* | | | | | |

---

## 12. Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tester | | | |
| Reviewer | | | |

*Document version 1.0 — Attend v1.0.0 enrollment & scale testing.*
