// Firebase Web App configuration. Fill from Firebase Console > Project Settings > Your apps.
// Web app identifiers aren't secret, but NEVER commit service-account keys or medical records.
export const firebaseConfig = {
 apiKey: "REPLACE_WITH_API_KEY",
 authDomain: "REPLACE_WITH_PROJECT_ID.firebaseapp.com",
 projectId: "REPLACE_WITH_PROJECT_ID",
 storageBucket: "REPLACE_WITH_STORAGE_BUCKET",
 appId: "REPLACE_WITH_APP_ID"
};
export const firebaseReady = !Object.values(firebaseConfig).some(v => v.startsWith("REPLACE_WITH"));
