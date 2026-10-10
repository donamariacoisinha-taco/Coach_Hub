import { describe, it, expect, vi } from 'vitest';
import { applyPrescription, editAndReplicate, loadPrescriptions, savePrescriptions, replicateCompletedSet } from './exercisePrescriptions';

describe('personal exercise prescriptions', () => {
 it('loads all individual sets and replaces the old exercise targets', () => {
  const sets = [{weight:45,reps:'8',rpe:7,rest_time:90},{weight:50,reps:'6',rpe:9,rest_time:120}];
  const result = applyPrescription({exercise_id:'new',sets:4,weight:100,reps:'20',rest_time:30},sets);
  expect(result).toMatchObject({exercise_id:'new',sets:2,weight:45,reps:'8',default_rpe:7,rest_time:90,sets_json:sets});
  expect(result.sets_json).not.toBe(sets);
 });
 it('replicates each edited value to every upcoming series', () => {
  const manual = new Set<string>();
  let sets = [{weight:0,reps:10,rpe:8},{weight:0,reps:10,rpe:8},{weight:0,reps:10,rpe:8}];
  sets = editAndReplicate(sets,0,'weight',45,manual,new Set());
  sets = editAndReplicate(sets,0,'reps',12,manual,new Set());
  sets = editAndReplicate(sets,0,'rpe',7,manual,new Set());
  expect(sets[1]).toEqual({weight:45,reps:12,rpe:7});
  expect(sets[2]).toEqual({weight:45,reps:12,rpe:7});
 });
 it('uses the latest edit as the baseline even for manually configured upcoming series', () => {
  const manual = new Set<string>();
  let sets = [{weight:0,reps:10},{weight:0,reps:10}];
  sets = editAndReplicate(sets,1,'weight',60,manual,new Set());
  sets = editAndReplicate(sets,0,'weight',45,manual,new Set());
  sets = editAndReplicate(sets,0,'reps',12,manual,new Set());
  expect(sets[1]).toEqual({weight:45,reps:12});
 });
 it('preserves completed series and does not mutate the source', () => {
  const sets = [{weight:30},{weight:40}];
  expect(editAndReplicate(sets,0,'weight',50,new Set(),new Set([1]))[1].weight).toBe(40);
  expect(sets[0].weight).toBe(30);
 });
 it('replicates zero load and individual rest without inventing defaults', () => {
  const sets = [{weight:30,rest_time:60},{weight:40,rest_time:60}];
  const next = editAndReplicate(sets,0,'weight',0,new Set(),new Set());
  expect(editAndReplicate(next,0,'rest_time',120,new Set(),new Set())[1]).toEqual({weight:0,rest_time:120});
 });
});

it('salva e recupera configuração de convidado para qualquer ficha', async () => {
 const values = new Map<string,string>();
 vi.stubGlobal('localStorage', { getItem: (key:string) => values.get(key) ?? null, setItem: (key:string,value:string) => values.set(key,value) });
 const sets = [{weight:50,reps:'8',rpe:9,rest_time:120}];
 await savePrescriptions(true,[{exercise_id:'supino',sets_json:sets}]);
 const loaded = await loadPrescriptions(true);
 expect(applyPrescription({exercise_id:'supino',category_id:'outra-ficha'},loaded.supino)).toMatchObject({sets_json:sets,sets:1,weight:50,rest_time:120});
 vi.unstubAllGlobals();
});

it('copies all four completed values to pending series while preserving executed series and set types', () => {
 const sets = [
  {weight:10,reps:5,rpe:6,rest_time:30,type:'Aquecimento'},
  {weight:45,reps:8,rpe:9,rest_time:120,type:'Trabalho'},
  {weight:70,reps:3,rpe:10,rest_time:60,type:'Drop'},
  {weight:80,reps:2,rpe:10,rest_time:60,type:'Trabalho'},
  {weight:90,reps:1,rpe:10,rest_time:60,type:'Trabalho'},
 ];
 const result = replicateCompletedSet(sets,1,new Set([0,3]));
 expect(result[0]).toEqual(sets[0]);
 expect(result[3]).toEqual(sets[3]);
 expect(result[2]).toEqual({...sets[1],type:'Drop'});
 expect(result[4]).toEqual(sets[1]);
 expect(sets[2].weight).toBe(70);
});
