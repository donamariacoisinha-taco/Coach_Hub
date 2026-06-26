import { runProtocolFailsafeAndAudit } from './lib/utils/failsafe';
import { supabase } from './lib/api/supabase';

async function test() {
  console.log('Testing runProtocolFailsafeAndAudit...');
  // Let's get any profile first
  const { data: profiles, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error fetching profile:', error);
    return;
  }
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found in database.');
    return;
  }
  const profile = profiles[0];
  console.log('Using profile:', profile.id, profile.email);
  try {
    const report = await runProtocolFailsafeAndAudit(profile.id, profile.email || 'test@example.com', profile.active_plan_id);
    console.log('Audit completed, report:', JSON.stringify(report, null, 2));
  } catch (err: any) {
    console.error('Test caught error outside audit:', err);
  }
}

test();
