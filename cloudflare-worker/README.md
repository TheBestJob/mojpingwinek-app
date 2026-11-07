# Mój Pingwinek — private document API

This Cloudflare Worker verifies Firebase JWT ID tokens server-side and stores **fictional test files only** in the private Supabase bucket `pingwinek-documents`.

## Deploy manually from the Cloudflare dashboard

1. Open your existing Worker [moj-pingwinek-api](https://dash.cloudflare.com/) → **Edit code**.
2. Open [src/index.js](src/index.js) and copy its complete contents into the Worker editor, replacing Hello World. Click **Deploy**.
3. Open **Settings → Variables and Secrets**. Add:
   - `SUPABASE_URL` = `https://xgfphjlvrcashjsxyesi.supabase.co` (text)
   - `SUPABASE_SERVICE_ROLE_KEY` = the **legacy service_role API JWT**, from Supabase Project Settings → API Keys. Set type **Secret**, never Plaintext. Do not share this key in chat or commit it to GitHub.
4. Save / deploy the updated variables. Open [the API health endpoint](https://moj-pingwinek-api.dj-janev.workers.dev/health). It should return `{\"status\":\"ok\",\"service\":\"pingwinek-documents-api\"}`.
5. Test only with a fictional Firebase account after the 5.1 frontend is connected.

## API

All `/files` endpoints require `Authorization: Bearer <Firebase ID token>`.

- `GET /health`: no auth, checks the worker itself, **not** Supabase connectivity.
- `GET /files`: list files for the authenticated UID.
- `POST /files`: raw PDF/JPEG/PNG body with `Content-Type` and `X-File-Name`; max **5 MB** per upload.
- `GET /files/<id>`: download one file.
- `DELETE /files/<id>`: delete one file.

All object paths are composed by the Worker from the verified Firebase UID; clients cannot choose a folder. Supabase service_role bypasses RLS; never expose its key to the browser, GitHub or users.

## Safety and limitations

- Only allows browser requests from `https://thebestjob.github.io` (CORS); this is not the authentication boundary, Firebase JWT verification is.
- This is a **testing backend**: no antivirus scanning, upload rate limiter, account deletion cascade, file retention, security audit, comprehensive billing protection, or sensitive-data compliance review yet.
- All users can register through Firebase without manual approval.
- If you rotate the Supabase key, update the Worker secret and redeploy it.
- Your previous Supabase Storage RLS policies apply to direct clients, not the privileged service_role API used here. Keep them restrictive.
- Cloudflare free-tier request, CPU and body-size limits can change. Check before production.
