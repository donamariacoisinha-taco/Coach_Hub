import { supabase } from './lib/api/supabase';

async function run() {
  console.log('--- DB Check ---');
  const { data: folders, error: fErr } = await supabase.from('workout_folders').select('*').limit(5);
  console.log('Folders error:', fErr);
  console.log('Folders count:', folders?.length, folders);

  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(5);
  console.log('Profiles error:', pErr);
  console.log('Profiles count:', profiles?.length, profiles);

  const { data: categories, error: cErr } = await supabase.from('workout_categories').select('*').limit(5);
  console.log('Categories error:', cErr);
  console.log('Categories count:', categories?.length, categories);
}

run();
