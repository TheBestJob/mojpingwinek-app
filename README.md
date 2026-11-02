# 🐧 Mój Pingwinek — Version 5.0 (online test)

## Links

- **Version 5.0: original mobile design + Firebase login and live data**: https://thebestjob.github.io/mojpingwinek-app/v5.html
- Preserved **Demo 3.0 (offline prototype)**: https://thebestjob.github.io/mojpingwinek-app/
- Preserved **Online 4.0 (simple interface)**: https://thebestjob.github.io/mojpingwinek-app/online.html
- **Android APK builds**: https://github.com/TheBestJob/mojpingwinek-app/actions/workflows/android-apk.yml — successful build → Artifacts → `MojPingwinek-5.0-test-APK`

## What is implemented

- Firebase Authentication: create account, sign in/out, password reset
- In-app monthly calendar: add and delete events, realtime Firebase sync, existing Online 4.0 events appear
- Observation journal: add and delete notes, realtime Firebase sync, existing Online 4.0 notes appear
- Firebase Storage upload/download/delete for PDF, JPG, PNG up to 10 MB, once Storage is activated and security rules are published
- Original Demo 3.0 blue/teal dashboard and bottom navigation with mobile-friendly screens
- Demonstration-only sections: medical passport, specialists, support, formalities, notifications
- Version 5 Android **test APK** opens hosted `v5.html` so the phone and website use the same live Firebase backend; Internet required

## Firebase setup

Project ID: `pingwinek-test`.

1. Enable Authentication → Email/Password.
2. Firestore Database → Rules → publish [firestore.rules](firestore.rules).
3. Authentication → Settings → Authorized domains: add `thebestjob.github.io` if needed.
4. Storage → create bucket (may require Blaze billing) and publish [storage.rules](storage.rules).
5. Test separate **fictional** user accounts: each must only see its own data.
6. Test login, save/read/delete event and journal entry from two devices, then test fake PDF upload/delete.
7. Do not invite real families or upload real sensitive information before privacy/security review.

## Important limitations

This is a **public-facing testing prototype**, not a production-ready health records app. It lacks child-specific consent/legal basis assessment, privacy documentation, data export and complete account deletion, comprehensive access-control testing, notifications and background reminders, monitoring and hardening. Firebase user data isn't ready for real child medical records. File downloads should currently be tested through the browser version, since the APK WebView's blob download support is limited. Google Calendar integration is intentionally excluded. The old app and web demos have not been overwritten.

## Repo structure

- `index.html`: Demo 3.0
- `online.html` and `online.js`: Version 4.0
- `v5.html` and `v5.js`: combined Version 5.0
- `firebase-config.js`: public Firebase Web SDK identifiers
- `firestore.rules`, `storage.rules`: user-scoped access rules
- `app/`: Android wrapper for hosted version 5.0
