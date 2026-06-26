import { supabase } from './lib/api/supabase';

async function test() {
  try {
    console.log('Testing .eq(id, null)...');
    const { data, error } = await supabase.from('workout_folders').select('*').eq('id', null as any);
    console.log('Result for null:', data, error);
  } catch (err: any) {
    console.error('Error for null:', err.message, err.stack);
  }

  try {
    console.log('Testing .eq(id, undefined)...');
    const { data, error } = await supabase.from('workout_folders').select('*').eq('id', undefined as any);
    console.log('Result for undefined:', data, error);
  } catch (err: any) {
    console.error('Error for undefined:', err.message, err.stack);
  }
}

test();
