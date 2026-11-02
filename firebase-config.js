// Firebase web client identifiers (public config; not administrator credentials).
// Never commit service account private keys or real medical information.
export const firebaseConfig = {
  apiKey: "AIzaSyC-VRrWL6hpGyLzzCQ-cJAaBquS3EzvSu4",
  authDomain: "pingwinek-test.firebaseapp.com",
  projectId: "pingwinek-test",
  storageBucket: "pingwinek-test.firebasestorage.app",
  messagingSenderId: "831447460361",
  appId: "1:831447460361:web:5d6ace59067092ce9166d8",
  measurementId: "G-C4ETLKNVJP"
};
export const firebaseReady = !Object.values(firebaseConfig).some(v => v.startsWith("REPLACE_WITH"));
