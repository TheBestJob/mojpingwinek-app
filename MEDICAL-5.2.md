# 🐧 Mój Pingwinek 5.2 — Magda feedback test

- **New version:** https://thebestjob.github.io/mojpingwinek-app/v5.2.html
- **Working 5.1 preserved:** https://thebestjob.github.io/mojpingwinek-app/v5.1.html
- **Original versions preserved:** `index.html`, `online.html`, `v5.html`

## Included

- Original teal/mobile layout, Firebase email sign-up and login
- Existing Firebase calendar and observation journal
- **Editable medical passport** (test nickname, birthdate and allergies)
- **Diagnoses** entered by the parent with optional ICD-10 code, date and specialist; does **not** diagnose
- **Medication and supplement list** with dose and time entered by the parent; does **not** calculate or recommend doses, and does **not** deliver notifications
- **Specialists** private contact list, not a live directory or booking system
- Existing Supabase document upload, list, download, delete via Cloudflare Worker; only fictional files

## Required before testing new forms

In Firebase Console → Firestore → Rules, paste the **complete** contents of [firestore-v5.2.rules](firestore-v5.2.rules) **replacing** the prior rules, then publish. The old rules only allow calendar, notes and document metadata: medical forms will show permission-denied without the new rules.

Do not deploy `firestore-v5.2.rules` without reviewing and testing account isolation first. This copy is separate from existing `firestore.rules` on purpose.

## Test plan (fictional data only)

1. Log into 5.2 with a test Firebase account.
2. Open Passport and save a pseudonym and fictional notes.
3. Add an imaginary diagnosis, medication and specialist; refresh and check they persist.
4. Log into the **same account** on another device; data should appear there as well.
5. Log into a **second different account**; it must **not** see any of the first account's passport, diagnoses, medicines, specialists, calendar entries, notes or documents.
6. Upload a non-sensitive dummy PDF and test download/delete from the browser. The Cloudflare Worker file API is unchanged from 5.1.
7. Recheck old calendar and journal data are still present.

## Known limitations

- One medical profile per Firebase account (not yet multiple children).
- ICD-10 field is free text; no authoritative code search/validation yet.
- No medication reminders, schedules or clinical alerts.
- No live appointment booking or professional verification.
- No real file-to-diagnosis linking or categorisation yet.
- No fine-grained consent, account erasure and export, comprehensive audit log, malware scanning or formal privacy assessment.
- Do not enter real child / medical records. This is an unvalidated test prototype, not a finished health-data product.

## Follow-up architecture

Production should have multiple child profiles, validated code selection, care-team roles with explicit permissions, document tags tied to profiles, data export/deletion, verified access control and GDPR safeguards.
