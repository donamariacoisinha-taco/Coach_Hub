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
  exercise_security: {},
  preferences_security: {},
  view_security: {},
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

function authHeaders(token, extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token}`,
    ...extra,
  };
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
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(`Auth user lookup failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function ensureProfile(token, email) {
  const user = await getAuthUser(token);
  const existing = await request(`/rest/v1/profiles?id=eq.${user.id}&select=id`, {
    headers: authHeaders(token),
  });
  if (!existing.ok) {
    throw new Error(`Profile lookup failed: ${existing.status} ${await existing.text()}`);
  }
  const rows = await existing.json();
  if (!rows.length) {
    const insert = await request('/rest/v1/profiles', {
      method: 'POST',
      headers: authHeaders(token, {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      }),
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
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
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

async function validateExerciseSecurity(athleteToken, adminId, athleteId) {
  const createOwn = await request('/rest/v1/exercises', {
    method: 'POST',
    headers: authHeaders(athleteToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify({
      user_id: athleteId,
      name: `P0.2 owner exercise ${runKey}`,
      muscle_group: 'homologation',
      is_active: false,
    }),
  });
  const createOwnText = await createOwn.text();
  const createOwnRows = safeJson(createOwnText);
  if (!createOwn.ok || !Array.isArray(createOwnRows) || !createOwnRows[0]?.id) {
    throw new Error(`Owner exercise insert failed: ${createOwn.status} ${createOwnText}`);
  }
  const exerciseId = createOwnRows[0].id;

  const updateOwn = await request(`/rest/v1/exercises?id=eq.${exerciseId}`, {
    method: 'PATCH',
    headers: authHeaders(athleteToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify({ description: 'P0.2 owner update passed' }),
  });
  const updateOwnText = await updateOwn.text();
  const updateOwnRows = safeJson(updateOwnText);
  if (!updateOwn.ok || !Array.isArray(updateOwnRows) || updateOwnRows.length !== 1) {
    throw new Error(`Owner exercise update failed: ${updateOwn.status} ${updateOwnText}`);
  }

  const createForeign = await request('/rest/v1/exercises', {
    method: 'POST',
    headers: authHeaders(athleteToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify({
      user_id: adminId,
      name: `P0.2 forbidden foreign exercise ${runKey}`,
      muscle_group: 'homologation',
      is_active: false,
    }),
  });
  const createForeignText = await createForeign.text();
  if (createForeign.ok) {
    throw new Error(`Athlete inserted exercise for another user: ${createForeignText}`);
  }

  const globalLookup = await request('/rest/v1/exercises?user_id=is.null&is_active=eq.true&select=id,description&limit=1', {
    headers: authHeaders(athleteToken),
  });
  const globalText = await globalLookup.text();
  const globalRows = safeJson(globalText);
  if (!globalLookup.ok || !Array.isArray(globalRows) || !globalRows[0]?.id) {
    throw new Error(`Global exercise lookup failed: ${globalLookup.status} ${globalText}`);
  }

  const patchGlobal = await request(`/rest/v1/exercises?id=eq.${globalRows[0].id}`, {
    method: 'PATCH',
    headers: authHeaders(athleteToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify({ description: `P0.2 forbidden global update ${runKey}` }),
  });
  const patchGlobalText = await patchGlobal.text();
  const patchGlobalRows = safeJson(patchGlobalText);
  if (patchGlobal.ok && Array.isArray(patchGlobalRows) && patchGlobalRows.length > 0) {
    throw new Error(`Athlete updated global exercise: ${patchGlobalText}`);
  }

  const deleteOwn = await request(`/rest/v1/exercises?id=eq.${exerciseId}`, {
    method: 'DELETE',
    headers: authHeaders(athleteToken, { Prefer: 'return=representation' }),
  });
  const deleteOwnText = await deleteOwn.text();
  const deleteOwnRows = safeJson(deleteOwnText);
  if (!deleteOwn.ok || !Array.isArray(deleteOwnRows) || deleteOwnRows.length !== 1) {
    throw new Error(`Owner exercise delete failed: ${deleteOwn.status} ${deleteOwnText}`);
  }

  return {
    owner_insert_status: createOwn.status,
    owner_update_status: updateOwn.status,
    foreign_insert_status: createForeign.status,
    global_update_status: patchGlobal.status,
    global_update_rows: Array.isArray(patchGlobalRows) ? patchGlobalRows.length : null,
    owner_delete_status: deleteOwn.status,
  };
}

async function upsertPreferences(token, userId) {
  const response = await request('/rest/v1/admin_preferences?on_conflict=user_id', {
    method: 'POST',
    headers: authHeaders(token, {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    }),
    body: JSON.stringify({
      user_id: userId,
      favorite_exercises: [],
      recent_exercises: [],
    }),
  });
  return { response, text: await response.text() };
}

async function validatePreferencesSecurity(adminToken, athleteToken, adminId, athleteId) {
  const adminOwn = await upsertPreferences(adminToken, adminId);
  if (!adminOwn.response.ok) {
    throw new Error(`Admin own preferences upsert failed: ${adminOwn.response.status} ${adminOwn.text}`);
  }

  const athleteOwn = await upsertPreferences(athleteToken, athleteId);
  if (!athleteOwn.response.ok) {
    throw new Error(`Athlete own preferences upsert failed: ${athleteOwn.response.status} ${athleteOwn.text}`);
  }

  const foreignPatch = await request(`/rest/v1/admin_preferences?user_id=eq.${adminId}`, {
    method: 'PATCH',
    headers: authHeaders(athleteToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify({ recent_exercises: [{ test: runKey }] }),
  });
  const foreignPatchText = await foreignPatch.text();
  const foreignPatchRows = safeJson(foreignPatchText);
  if (foreignPatch.ok && Array.isArray(foreignPatchRows) && foreignPatchRows.length > 0) {
    throw new Error(`Athlete changed admin preferences: ${foreignPatchText}`);
  }

  const athleteDelete = await request(`/rest/v1/admin_preferences?user_id=eq.${athleteId}`, {
    method: 'DELETE',
    headers: authHeaders(athleteToken, { Prefer: 'return=representation' }),
  });
  const athleteDeleteText = await athleteDelete.text();
  if (!athleteDelete.ok) {
    throw new Error(`Athlete preference cleanup failed: ${athleteDelete.status} ${athleteDeleteText}`);
  }

  const adminDelete = await request(`/rest/v1/admin_preferences?user_id=eq.${adminId}`, {
    method: 'DELETE',
    headers: authHeaders(adminToken, { Prefer: 'return=representation' }),
  });
  const adminDeleteText = await adminDelete.text();
  if (!adminDelete.ok) {
    throw new Error(`Admin preference cleanup failed: ${adminDelete.status} ${adminDeleteText}`);
  }

  return {
    admin_own_upsert_status: adminOwn.response.status,
    athlete_own_upsert_status: athleteOwn.response.status,
    foreign_patch_status: foreignPatch.status,
    foreign_patch_rows: Array.isArray(foreignPatchRows) ? foreignPatchRows.length : null,
    athlete_cleanup_status: athleteDelete.status,
    admin_cleanup_status: adminDelete.status,
  };
}

async function validateInvokerView(athleteToken) {
  const authenticated = await request('/rest/v1/exercise_progress?select=exercise_id,date,max_weight,max_reps,volume&limit=1', {
    headers: authHeaders(athleteToken),
  });
  const authenticatedText = await authenticated.text();
  if (!authenticated.ok) {
    throw new Error(`Authenticated exercise_progress query failed: ${authenticated.status} ${authenticatedText}`);
  }

  const anonymous = await request('/rest/v1/exercise_progress?select=exercise_id,date&limit=1', {
    headers: { apikey: SUPABASE_KEY },
  });
  const anonymousText = await anonymous.text();
  const anonymousRows = safeJson(anonymousText);
  if (!anonymous.ok || !Array.isArray(anonymousRows) || anonymousRows.length !== 0) {
    throw new Error(`Anonymous exercise_progress query exposed rows: ${anonymous.status} ${anonymousText}`);
  }

  return {
    authenticated_status: authenticated.status,
    anonymous_status: anonymous.status,
    anonymous_rows: anonymousRows.length,
  };
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

    report.exercise_security = await validateExerciseSecurity(
      athleteLogin.access_token,
      adminId,
      athleteId,
    );
    report.preferences_security = await validatePreferencesSecurity(
      adminLogin.access_token,
      athleteLogin.access_token,
      adminId,
      athleteId,
    );
    report.view_security = await validateInvokerView(athleteLogin.access_token);

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
        headers: authHeaders(athleteLogin.access_token),
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
        { headers: authHeaders(adminLogin.access_token) },
      );
      report.admin_lifecycle.audit = { status: audit.status, body: await audit.text() };
      if (!audit.ok) {
        throw new Error(`Audit read failed: ${report.admin_lifecycle.audit.body}`);
      }

      report.status = 'approved';
      report.next_action = 'Suspend and demote the two disposable accounts after evidence collection.';
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
