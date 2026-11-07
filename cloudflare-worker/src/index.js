/**
 * Mój Pingwinek — Cloudflare Worker document API (TEST ONLY)
 *
 * Configure Worker secrets in Cloudflare (never commit credentials):
 * SUPABASE_URL = https://xgfphjlvrcashjsxyesi.supabase.co
 * SUPABASE_SERVICE_ROLE_KEY = Supabase legacy service_role JWT (SECRET)
 *
 * Firebase project is pinned to pingwinek-test.
 * The service-role key bypasses Supabase RLS. Accordingly ALL authorization
 * and object-key construction MUST remain server-side.
 *
 * Endpoints:
 * GET     /health
 * GET     /files
 * POST    /files   raw binary; Content-Type + X-File-Name
 * GET     /files/:id
 * DELETE  /files/:id
 */
const ORIGIN = "https://thebestjob.github.io";
const FIREBASE_PROJECT = "pingwinek-test";
const BUCKET = "pingwinek-documents";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = Object.freeze({
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png"
});
const ID_PATTERN = /^[a-f0-9-]{36}--[a-zA-Z0-9_.-]{1,80}\.(?:pdf|jpg|png)$/;
const UID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

function cors(request) {
  const origin = request.headers.get("Origin");
  return origin === ORIGIN ? {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-File-Name",
    "Access-Control-Max-Age": "7200",
    "Vary": "Origin"
  } : { "Vary": "Origin" };
}
function response(request, status, message, more = {}) {
  return new Response(JSON.stringify({error: message, ...more}), {
    status, headers: {"Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors(request)}
  });
}
function decodeB64Url(s) {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) throw new Error("Malformed token");
  const padding = "=".repeat((4 - s.length % 4) % 4);
  const binary = atob(s.replace(/-/g, "+").replace(/_/g, "/") + padding);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
function parseJsonPart(part) {
  return JSON.parse(new TextDecoder().decode(decodeB64Url(part)));
}
async function verifiedFirebaseUid(request) {
  const auth = request.headers.get("Authorization") || "";
  const match = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(auth);
  if (!match) throw new Error("Missing bearer token");
  const jwt = match[1], parts = jwt.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [rawHeader, rawBody, sig] = parts;
  const header = parseJsonPart(rawHeader), claims = parseJsonPart(rawBody);
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) throw new Error("Invalid algorithm");
  if (claims.aud !== FIREBASE_PROJECT || claims.iss !== "https://securetoken.google.com/" + FIREBASE_PROJECT) throw new Error("Invalid audience");
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(claims.iat) || claims.iat > now + 60 ||
      !Number.isFinite(claims.exp) || claims.exp <= now ||
      !Number.isFinite(claims.auth_time) || claims.auth_time > now + 60) throw new Error("Expired token");
  if (typeof claims.sub !== "string" || !UID_PATTERN.test(claims.sub)) throw new Error("Invalid user");
  const keySet = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
  if (!keySet.ok) throw new Error("Firebase keys unavailable");
  const keys = await keySet.json();
  const jwk = keys.keys?.find(k => k.kid === header.kid && k.kty === "RSA" && k.use === "sig");
  if (!jwk) throw new Error("Unrecognised signing key");
  const cryptoKey = await crypto.subtle.importKey("jwk", jwk, {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"}, false, ["verify"]);
  const data = new TextEncoder().encode(rawHeader + "." + rawBody);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, decodeB64Url(sig), data);
  if (!valid) throw new Error("Signature invalid");
  return claims.sub;
}
function supabaseHeaders(env, other={}) {
  return {"apikey":env.SUPABASE_SERVICE_ROLE_KEY,
    "Authorization":"Bearer "+env.SUPABASE_SERVICE_ROLE_KEY, ...other};
}
function supabaseBase(env) {
  const url = new URL(env.SUPABASE_URL);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) throw new Error("Invalid Supabase URL");
  return url.origin + "/storage/v1";
}
function safeName(original) {
  let name = String(original || "plik").normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9_.-]/g,"_")
    .replace(/\.{2,}/g, ".").replace(/^\.+/, "").slice(0,76);
  if (!name) name = "plik";
  return name;
}
async function upstream(request, url, env, options={}) {
  const res = await fetch(url, {...options, redirect:"manual"});
  if (!res.ok) {
    // Do not surface privileged backend error bodies to public clients.
    console.error("Supabase storage error",res.status);
    return response(request, res.status===404?404:502, "Storage operation unsuccessful");
  }
  return res;
}
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, {status:204,headers:cors(request)});
    if (request.headers.get("Origin") && request.headers.get("Origin") !== ORIGIN) return response(request,403,"Origin not allowed");
    const u = new URL(request.url);
    if (u.pathname === "/health" && request.method === "GET") return new Response(JSON.stringify({status:"ok",service:"pingwinek-documents-api"}),{headers:{"Content-Type":"application/json",...cors(request)}});
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return response(request,503,"Storage backend not configured");
    let uid; try {uid = await verifiedFirebaseUid(request)} catch(e) {console.error("Firebase token rejected:", e.message);return response(request,401,"Authentication required")}
    const base = supabaseBase(env);
    if (u.pathname === "/files" && request.method === "GET") {
      const url = base + "/object/list/" + BUCKET;
      const r = await upstream(request,url,env,{
        method:"POST",
        headers:supabaseHeaders(env,{"Content-Type":"application/json"}),
        body:JSON.stringify({prefix:uid+"/",limit:100,offset:0,sortBy:{column:"created_at",order:"desc"}})
      });
      if (r instanceof Response && r.status >= 400) return r;
      const rows = await r.json();
      return new Response(JSON.stringify({files:Array.isArray(rows)?rows.filter(x=>ID_PATTERN.test(x.name)).map(x=>({id:x.name,name:x.name.split("--").slice(1).join("--"),size:x.metadata?.size||0,createdAt:x.created_at})):[]}),{headers:{"Content-Type":"application/json", "Cache-Control":"no-store",...cors(request)}});
    }
    if (u.pathname === "/files" && request.method === "POST") {
      const contentType = request.headers.get("Content-Type")?.split(";")[0].toLowerCase();
      if (!Object.hasOwn(ALLOWED_MIME, contentType)) return response(request,415,"Only PDF, JPG and PNG are allowed");
      const sizeHeader = Number(request.headers.get("Content-Length"));
      if (sizeHeader > MAX_FILE_BYTES) return response(request,413,"File too large (5 MB maximum)");
      const body = await request.arrayBuffer();
      if (body.byteLength < 1 || body.byteLength > MAX_FILE_BYTES) return response(request,413,"File must be 1 byte to 5 MB");
      const original = safeName(request.headers.get("X-File-Name"));
      const stem = original.replace(/\.(pdf|jpg|jpeg|png)$/i,"").slice(0,75);
      const id = crypto.randomUUID()+"--"+(stem||"plik")+"."+ALLOWED_MIME[contentType];
      const url = base+"/object/"+BUCKET+"/"+uid+"/"+id;
      const r = await upstream(request,url,env,{method:"POST",headers:supabaseHeaders(env,{"Content-Type":contentType,"x-upsert":"false"}),body});
      if (r instanceof Response && r.status >= 400) return r;
      return new Response(JSON.stringify({id,name:original}),{status:201,headers:{"Content-Type":"application/json","Cache-Control":"no-store",...cors(request)}});
    }
    const match = /^\/files\/([^/]+)$/.exec(u.pathname);
    if (!match) return response(request,404,"Unknown route");
    let id;try{id=decodeURIComponent(match[1])}catch{return response(request,400,"Invalid file ID")}
    if (!ID_PATTERN.test(id)) return response(request,400,"Invalid file ID");
    const path = uid+"/"+id;
    const url = base+"/object/"+BUCKET+"/"+path;
    if (request.method === "GET") {
      const r = await upstream(request,url,env,{method:"GET",headers:supabaseHeaders(env)});
      if (r instanceof Response && r.status >= 400) return r;
      return new Response(r.body,{status:200,headers:{"Content-Type":r.headers.get("Content-Type")||"application/octet-stream","Content-Disposition":"attachment; filename=\""+id.split("--").slice(1).join("--")+"\"","Cache-Control":"no-store",...cors(request)}});
    }
    if (request.method === "DELETE") {
      const r = await upstream(request,url,env,{method:"DELETE",headers:supabaseHeaders(env)});
      if (r instanceof Response && r.status >= 400) return r;
      return new Response(null,{status:204,headers:cors(request)});
    }
    return response(request,405,"Method not allowed");
  }
};
