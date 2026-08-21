# Attend Testing Documentation

| File | Format | Description |
|------|--------|-------------|
| [TEST_MANUAL.md](./TEST_MANUAL.md) | Markdown | Full QA workbook (all features) |
| [TEST_MANUAL.pdf](./TEST_MANUAL.pdf) | PDF | Printable full test manual |
| [ENROLLMENT_PRACTICAL_TEST.md](./ENROLLMENT_PRACTICAL_TEST.md) | Markdown | Enrollment & scale testing (hands-on) |
| [ENROLLMENT_PRACTICAL_TEST.pdf](./ENROLLMENT_PRACTICAL_TEST.pdf) | PDF | Built output (optional; compile from LaTeX) |
| [TEST_ENV_SETUP.md](./TEST_ENV_SETUP.md) | Markdown | Environment setup checklist |
| [TEST_RUN_LOG.md](./TEST_RUN_LOG.md) | Markdown | Session log templates |

## Log a test run on GitHub

Each session is an **Issue** with the full workbook as clickable checklists (steps, expected result, Actual fields). GitHub shows progress at the top of the issue.

1. Open **Issues → New issue**
2. Pick a template:
   - **Test environment setup** — install, services, seed accounts (do this first)
   - **Full QA test run** — complete `TEST_MANUAL.md` (auth, desktop, sections, enrollment, attendance, reports, RBAC)
   - **Enrollment practical test** — complete `ENROLLMENT_PRACTICAL_TEST.md` (3-pose camera, batch log, smoke tests, audit)
3. Fill the session header, tick **Pass** only when the expected result happens, write Actual / IDs in the blanks
4. File **bugs** as separate issues and paste the links into the bug log on the test-run issue

Templates live in [`.github/ISSUE_TEMPLATE/`](../../.github/ISSUE_TEMPLATE/). They appear in the New issue chooser after they are on the default branch.

## LaTeX sources (single file each)

| Document | LaTeX source |
|----------|----------------|
| Full test manual | [`docs/latex/testing-manual/main.tex`](../latex/testing-manual/main.tex) |
| Enrollment practical test | [`docs/latex/enrollment-practical/main.tex`](../latex/enrollment-practical/main.tex) |

## Build PDFs

```bash
# Full manual
docs/latex/testing-manual/build.sh

# Enrollment & scale workbook
docs/latex/enrollment-practical/build.sh

# Or via scripts
python3 scripts/generate_test_manual_pdf.py
python3 scripts/generate_enrollment_test_pdf.py
```

Outputs:
- `docs/testing/TEST_MANUAL.pdf`
- `docs/testing/ENROLLMENT_PRACTICAL_TEST.pdf`

Requires BasicTeX / MacTeX (`pdflatex`, `latexmk`).
