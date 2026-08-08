import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve('C:/coding/getstack/get.stack/.env.local');
const env = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const email = `probe-${Date.now()}@example.com`;
const password = 'ProbePass123!';

// 1. Create a confirmed user via admin API
let res = await fetch(`${url}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    apikey: serviceKey,
  },
  body: JSON.stringify({
    email,
    password,
    email_confirm: true,
  }),
});
const created = await res.json();
console.log('create user status', res.status, created.id ?? created.msg ?? created.message ?? created);

// 2. Sign in with password to get a session
res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    apikey: serviceKey,
  },
  body: JSON.stringify({ email, password }),
});
const session = await res.json();
console.log('sign-in status', res.status);
if (session.access_token) {
  const ref = new URL(url).hostname.split('.')[0];
  const cookie = `sb-${ref}-auth-token=${encodeURIComponent(JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  }))}`;
  console.log('COOKIE_BEGIN');
  console.log(cookie);
  console.log('COOKIE_END');
} else {
  console.log('no session', JSON.stringify(session).slice(0, 400));
}
process.exit(0);
