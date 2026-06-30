import { supabase } from './lib/api/supabase';

async function run() {
  console.log('Environment variables in process.env:');
  const envs = Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('SECRET') || k.includes('KEY'));
  console.log('Matching keys:', envs);
  for (const k of envs) {
    if (k.includes('SERVICE_ROLE') || k.includes('SECRET')) {
      console.log(`${k}: [length ${process.env[k]?.length}]`);
    } else {
      console.log(`${k}: ${process.env[k]}`);
    }
  }
}

run();
