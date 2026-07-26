import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const PORT = Number(process.env.PORT || 3011);
const TRIGGER_FILE = '.github/p0-homologation-trigger.txt';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required.');
}
if (!existsSync(TRIGGER_FILE)) {
  throw new Error(`Homologation trigger file not found: ${TRIGGER_FILE}`);
}

const triggerContent = readFileSync(TRIGGER_FILE, 'utf8');
const runKey = createHash('sha256').update(triggerContent).digest('hex').slice(0, 12);
const passwordHash = createHash('sha256')
  .update(`kyron-p0-hml-${runKey}-fixed-salt`)
  .digest('hex')
  .slice(0, 24);
const password = `Ky!${passwordHash}9aA`;
const adminEmail = `marivaldotorres+kyron-p0-admin-${runKey}@gmail.com`;
const athleteEmail = `marivaldotorres+kyron-p0-athlete-${runKey}@gmail.com`;

console.log(`::add-mask::${password}`);

const report = {
  run_key: runKey,
  accounts: {
    admin_email: adminEmail,
    athlete_email: athleteEmail,
    password: '[MASKED]',
    purpose: 'KYRON OS P0 integrated homologation only',
  },
  signup: {},
  login: {},
  profiles: {},
  ai_auth: {},
  admin_lifecycle: {},
  status: 'started',
};

function persistReport() {
  writeFileSync('p0-integrated-homologation-report.json', JSON.stringify(report, null, 2));
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function request(path, options = {}) {
  return fetch(`${SUPABASE_URL}${path}`, options);
}

async function signup(email) {
  const response = await request('/auth/v1/signup', {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      data: { purpose: 'kyron_p0_homologation', run_key: runKey },
    }),
  });
  const body = safeJson(await response.text());
  return {
    email,
    status: response.status,
    ok: response.ok,
    user_id: body?.user?.id || body?.id || null,
    has_session: Boolean(body?.session || body?.access_token),
    error: body?.msg || body?.message || body?.error_description || body?.error || null,
  };
}

async function login(email) {
  const response = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const body = safeJson(await response.text());
  return {
    email,
    status: response.status,
    ok: response.ok,
    user_id: body?.user?.id || null,
    access_token: body?.access_token || null,
    error: body?.msg || body?.message || body?.error_description || body?.error || null,
  };
}

async function getAuthUser(token) {
  const response = await request('/auth/v1/user', {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Auth user lookup failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function ensureProfile(token, email) {
  const user = await getAuthUser(token);
  const existing = await request(`/rest/v1/profiles?id=eq.${user.id}&select=id`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!existing.ok) {
    throw new Error(`Profile lookup failed: ${existing.status} ${await existing.text()}`);
  }
  const rows = await existing.json();
  if (!rows.length) {
    const insert = await request('/rest/v1/profiles', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id: user.id,
        email,
        name: 'KYRON P0 Homologação',
        onboarding_completed: true,
      }),
    });
    if (!insert.ok) {
      throw new Error(`Profile insert failed: ${insert.status} ${await insert.text()}`);
    }
  }
  return user.id;
}

async function waitForServer(baseUrl) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok || response.status < 500) return;
    } catch {
      // Server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Branch server did not start within the expected time.');
}

async function callLocalAI(baseUrl, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token !== undefined) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}/api/intelligence/proxy`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: 'health check',
      systemInstruction: 'Return JSON.',
    }),
  });
  return { status: response.status, body: await response.text() };
}

async function adminRpc(token, athleteId, changes) {
  const response = await request('/rest/v1/rpc/admin_update_user_access', {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_user_id: athleteId,
      p_role: changes.role ?? null,
      p_plan: changes.plan ?? null,
      p_status: changes.status ?? null,
      p_reason: changes.reason ?? null,
    }),
  });
  return { status: response.status, ok: response.ok, body: await response.text() };
}

let serverProcess;
try {
  report.signup.admin = await signup(adminEmail);
  report.signup.athlete = await signup(athleteEmail);

  const adminLogin = await login(adminEmail);
  const athleteLogin = await login(athleteEmail);
  report.login.admin = { ...adminLogin, access_token: adminLogin.access_token ? '[MASKED]' : null };
  report.login.athlete = { ...athleteLogin, access_token: athleteLogin.access_token ? '[MASKED]' : null };

  if (!adminLogin.access_token || !athleteLogin.access_token) {
    report.status = 'confirmation_required';
    report.next_action = 'Confirm the two run-specific auth users, then rerun the same CI job.';
    persistReport();
    process.exitCode = 20;
  } else {
    const adminId = await ensureProfile(adminLogin.access_token, adminEmail);
    const athleteId = await ensureProfile(athleteLogin.access_token, athleteEmail);
    report.profiles = { admin_id: adminId, athlete_id: athleteId };

    const baseUrl = `http://127.0.0.1:${PORT}`;
    serverProcess = spawn('node', ['dist/server.cjs'], {
      env: {
        ...process.env,
        PORT: String(PORT),
        NODE_ENV: 'production',
        SUPABASE_URL,
        SUPABASE_ANON_KEY: SUPABASE_KEY,
        GEMINI_API_KEY: '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let serverOutput = '';
    serverProcess.stdout.on('data', chunk => { serverOutput += chunk.toString(); });
    serverProcess.stderr.on('data', chunk => { serverOutput += chunk.toString(); });

    await waitForServer(baseUrl);

    const missing = await callLocalAI(baseUrl, undefined);
    const invalid = await callLocalAI(baseUrl, 'invalid-token');
    const valid = await callLocalAI(baseUrl, athleteLogin.access_token);
    report.ai_auth = { missing, invalid, valid };

    if (missing.status !== 401 || !missing.body.includes('Missing Authorization')) {
      throw new Error(`Missing-token test failed: ${JSON.stringify(missing)}`);
    }
    if (invalid.status !== 401 || !invalid.body.includes('Invalid or expired')) {
      throw new Error(`Invalid-token test failed: ${JSON.stringify(invalid)}`);
    }
    if (valid.body.includes('Invalid or expired') || valid.body.includes('Missing Authorization')) {
      throw new Error(`Valid token rejected by auth middleware: ${JSON.stringify(valid)}`);
    }

    report.admin_lifecycle.non_admin_attempt = await adminRpc(
      athleteLogin.access_token,
      athleteId,
      { plan: 'premium', reason: 'negative authorization test' },
    );
    if (report.admin_lifecycle.non_admin_attempt.ok) {
      throw new Error('Non-admin account changed user access.');
    }

    report.admin_lifecycle.premium = await adminRpc(
      adminLogin.access_token,
      athleteId,
      { plan: 'premium', reason: 'P0 integrated homologation' },
    );

    if (!report.admin_lifecycle.premium.ok) {
      report.status = 'admin_promotion_required';
      report.next_action = 'Promote only the disposable admin account, then rerun the same CI job.';
      writeFileSync('server-output.log', serverOutput);
      persistReport();
      process.exitCode = 30;
    } else {
      report.admin_lifecycle.suspended = await adminRpc(
        adminLogin.access_token,
        athleteId,
        { status: 'suspended', reason: 'P0 integrated homologation' },
      );
      if (!report.admin_lifecycle.suspended.ok) {
        throw new Error(`Suspend failed: ${report.admin_lifecycle.suspended.body}`);
      }

      const protectedRead = await request('/rest/v1/workout_categories?select=id&limit=1', {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${athleteLogin.access_token}`,
        },
      });
      report.admin_lifecycle.suspended_protected_read = {
        status: protectedRead.status,
        body: await protectedRead.text(),
      };

      report.admin_lifecycle.reactivated = await adminRpc(
        adminLogin.access_token,
        athleteId,
        { status: 'active', plan: 'free', reason: 'P0 integrated homologation cleanup' },
      );
      if (!report.admin_lifecycle.reactivated.ok) {
        throw new Error(`Reactivation failed: ${report.admin_lifecycle.reactivated.body}`);
      }

      const audit = await request(
        `/rest/v1/user_access_audit?target_user_id=eq.${athleteId}&select=id,reason,created_at&order=created_at.desc`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${adminLogin.access_token}`,
          },
        },
      );
      report.admin_lifecycle.audit = { status: audit.status, body: await audit.text() };
      if (!audit.ok) {
        throw new Error(`Audit read failed: ${report.admin_lifecycle.audit.body}`);
      }

      report.status = 'approved';
      report.next_action = 'Remove the two disposable accounts after evidence collection.';
      writeFileSync('server-output.log', serverOutput);
      persistReport();
    }
  }
} catch (error) {
  report.status = 'failed';
  report.error = error instanceof Error ? error.message : String(error);
  persistReport();
  console.error(error);
  process.exitCode = 1;
} finally {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
  }
  persistReport();
}
