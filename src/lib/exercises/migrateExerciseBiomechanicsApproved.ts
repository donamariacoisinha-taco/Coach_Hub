import { supabase } from '../api/supabase';
import { getExerciseBiomechanics } from './exerciseTaxonomy';
import { Exercise, ExerciseBiomechanics } from '../../types';
import * as fs from 'fs';
import * as path from 'path';

export interface MigrationItem {
  id: string;
  name: string;
  current_muscle_group: string;
  current_subgroup: string;
  current_equipment: string;
  biomechanics_payload: ExerciseBiomechanics;
  confidence: 'high' | 'medium' | 'low' | 'critical';
  reason: string;
  approved: boolean;
}

const CRITICAL_IDS = [
  '5ef7ff26-97ea-469b-941d-7a25489df311', // Apoio declinado (Fechado)
  '7a496714-b081-4c0f-874a-aea5b126c7fe', // apoio reto (fechado)
  '27a458a8-ae8c-4e6f-87cf-a46614cc7925', // Apoio reto (fechado)
  'd61ec6c5-f1da-4bdd-b209-d466e73e2c89'  // Mesa flexora
];

export async function runMigration() {
  const args = process.argv;
  const isApply = args.includes('--apply');

  console.log('======================================================');
  console.log(`🚀 KYRON OS — MIGRAÇÃO CONTROLADA BIOMECÂNICA 2.0`);
  console.log('======================================================');
  console.log(isApply ? '⚠️ [MODO APPLY] O SCRIPT IRÁ ATUALIZAR O BANCO DE DADOS!' : '🔍 [MODO PREVIEW] NENHUM DADO SERÁ SALVO NO BANCO.');

  console.log('[Info] Buscando exercícios cadastrados no Supabase...');
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name');

  if (error) {
    console.error('[-] Erro ao carregar exercícios:', error.message);
    return;
  }

  if (!exercises || exercises.length === 0) {
    console.warn('[!] Nenhum exercício retornado do banco.');
    return;
  }

  console.log(`[Info] Total de exercícios encontrados: ${exercises.length}`);

  // Create Backup snapshot
  const backupData = exercises.map(ex => ({
    id: ex.id,
    name: ex.name,
    biomechanics: ex.biomechanics,
    muscle_group: ex.muscle_group,
    subgroup: ex.subgroup,
    equipment: ex.equipment
  }));

  const backupPath = path.join(process.cwd(), 'exercise_biomechanics_backup_before_apply.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`[Ok] Backup salvo em: ${backupPath}`);

  const approvedList: MigrationItem[] = [];
  const ignoredList: MigrationItem[] = [];
  const correctedCriticalsList: MigrationItem[] = [];

  exercises.forEach((ex: any) => {
    const rawName = ex.name || '';
    const nameLower = rawName.toLowerCase();
    const rawMg = ex.muscle_group || '';
    const rawSub = ex.subgroup || '';
    const rawEq = ex.equipment || '';
    const hasImg = !!(ex.image_url || ex.thumbnail_url);

    // Compute dynamic suggested biomechanics
    const biomechanics_payload = getExerciseBiomechanics(ex as Exercise);

    // Classify Confidence Level & Critical state
    let confidence: 'high' | 'medium' | 'low' | 'critical' = 'high';
    let reason = 'Alta confiança: Grupo, subgrupo e equipamento coerentes.';
    let isCritical = false;

    // Detect critical anomaly cases (same criteria as dry-run to identify them)
    if (nameLower.includes('apoio') && (rawSub.toLowerCase().includes('glúteo') || rawSub.toLowerCase().includes('abdutores'))) {
      isCritical = true;
      confidence = 'critical';
      reason = 'Crítico corrigido manualmente: Exercício de empurrar classificado no subgrupo de Glúteos.';
    } else if (nameLower.includes('flexora') && (rawMg.toLowerCase().includes('abdômen') || rawMg.toLowerCase().includes('abdomen') || rawSub.toLowerCase().includes('abdômen') || rawSub.toLowerCase().includes('abdomen'))) {
      isCritical = true;
      confidence = 'critical';
      reason = 'Crítico corrigido manualmente: Mesa flexora classificada como Abdômen.';
    } else if ((nameLower.includes('supino') || nameLower.includes('crucifixo') || nameLower.includes('peito')) && rawMg.toLowerCase() === 'braços' && !nameLower.includes('fechado') && !nameLower.includes('triceps')) {
      isCritical = true;
      confidence = 'critical';
      reason = 'Crítico corrigido manualmente: Exercício de Peitoral classificado no grupo Braços.';
    } else if ((nameLower.includes('agachamento') || nameLower.includes('leg press') || nameLower.includes('extensora') || nameLower.includes('flexora') || nameLower.includes('stiff')) && 
               ['peito', 'braços', 'bíceps', 'tríceps', 'ombros', 'costas', 'abdômen'].includes(rawMg.toLowerCase())) {
      isCritical = true;
      confidence = 'critical';
      reason = `Crítico corrigido manualmente: Exercício de perna com grupo muscular superior.`;
    }

    // Additional generic/low confidence checks
    if (!isCritical) {
      if (!rawSub && (!rawEq || rawEq === 'Não especificado' || rawEq === '')) {
        confidence = 'low';
        reason = 'Baixa confiança: Sem subgrupo e sem equipamento especificado.';
      } else if (!rawSub || rawEq === 'Não especificado' || rawEq === '') {
        confidence = 'low';
        reason = 'Baixa confiança: Dados incompletos.';
      }
    }

    // WHITELIST DECISION:
    // Approved if:
    // 1. It is one of the manually corrected critical exercises
    // 2. Or, it has high confidence and NO critical / low confidence classification
    const isManuallyWhitelistedCritical = CRITICAL_IDS.includes(ex.id);
    const approved = isManuallyWhitelistedCritical || (confidence === 'high' && !isCritical);

    const migrationItem: MigrationItem = {
      id: ex.id,
      name: rawName,
      current_muscle_group: rawMg,
      current_subgroup: rawSub,
      current_equipment: rawEq,
      biomechanics_payload,
      confidence,
      reason,
      approved
    };

    if (approved) {
      approvedList.push(migrationItem);
      if (isManuallyWhitelistedCritical) {
        correctedCriticalsList.push(migrationItem);
      }
    } else {
      ignoredList.push(migrationItem);
    }
  });

  // Printing preview / summary information
  console.log(`\n======================================================`);
  console.log(`📊 WH_LIST DE MIGRAÇÃO PRONTA`);
  console.log(`======================================================`);
  console.log(`- Exercícios APROVADOS para migração  : ${approvedList.length}`);
  console.log(`- Exercícios IGNORADOS (baixo nível/incompletos): ${ignoredList.length}`);
  console.log(`- Críticos CORRIGIDOS e whitelistetados  : ${correctedCriticalsList.length}`);
  console.log(`======================================================`);

  if (correctedCriticalsList.length > 0) {
    console.log('\n✅ DETALHE DOS CRÍTICOS MANUALMENTE CORRIGIDOS & WHITELISTADOS:');
    correctedCriticalsList.forEach((item, index) => {
      console.log(`[${index + 1}] "${item.name}" (ID: ${item.id})`);
      console.log(`    -> Grupo principal: ${item.biomechanics_payload.primary_group}`);
      console.log(`    -> Agonistas: ${JSON.stringify(item.biomechanics_payload.agonist_muscles)}`);
      console.log(`    -> Sinergistas: ${JSON.stringify(item.biomechanics_payload.synergist_muscles)}`);
      console.log(`    -> Padrão: ${item.biomechanics_payload.movement_pattern}`);
      console.log(`    -> Equipamento: ${JSON.stringify(item.biomechanics_payload.equipment_needed)}`);
      console.log(`    -> Tags: ${JSON.stringify(item.biomechanics_payload.tags)}`);
    });
  }

  if (isApply) {
    console.log('\n[Processando] Iniciando gravação de dados aprovados no banco de dados...');
    let successCount = 0;
    let failCount = 0;

    for (const item of approvedList) {
      const { data: updatedRows, error: updateError } = await supabase
        .from('exercises')
        .update({ biomechanics: item.biomechanics_payload })
        .eq('id', item.id)
        .select('id');

      if (updateError) {
        console.error(`[-] Falha ao migrar exercício "${item.name}":`, updateError.message);
        failCount++;
      } else if (!updatedRows || updatedRows.length === 0) {
        console.error(`[-] Falha silenciosa: RLS bloqueou a escrita ou registro inexistente para "${item.name}".`);
        failCount++;
      } else {
        successCount++;
      }
    }

    const expectedCount = approvedList.length;

    if (successCount === 0 || successCount !== expectedCount) {
      console.error(`\n❌ ERRO CRÍTICO NA GRAVAÇÃO DOS DADOS!`);
      console.error(`------------------------------------------------------`);
      console.error(`- Esperado (Whitelist): ${expectedCount}`);
      console.error(`- Aplicados com sucesso: ${successCount}`);
      console.error(`- Falhas/Bloqueios RLS : ${failCount}`);
      console.error(`------------------------------------------------------`);
      console.error(`Causa provável: As regras de RLS do Supabase impediram a escrita via chave pública anônima sem sessão administrativa ativa.`);
      console.error(`Ação: Execute a migração SQL gerada "db_data_v10_apply_biomechanics_whitelist.sql" diretamente no SQL Editor do console Supabase.\n`);
      process.exit(1);
    }

    console.log(`\n======================================================`);
    console.log(`🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO COERENTE!`);
    console.log(`======================================================`);
    console.log(`- Total com sucesso: ${successCount}`);
    console.log(`- Falhas           : ${failCount}`);
    console.log(`- Total pendentes (ignorados): ${ignoredList.length}`);
    console.log(`======================================================`);

    if (approvedList.length > 0) {
      console.log('\n📋 AMOSTRA DE 10 EXERCÍCIOS MIGRADOS COM SUCESSO:');
      const sample = approvedList.slice(0, 10);
      sample.forEach((item, index) => {
        console.log(`[${index + 1}] "${item.name}"`);
        console.log(`    -> Biomechanics:`, JSON.stringify(item.biomechanics_payload));
      });
    }

    if (ignoredList.length > 0) {
      console.log('\n📋 LISTA DE ALGUNS EXERCÍCIOS PENDENTES (IGNORADOS):');
      ignoredList.slice(0, 15).forEach((item, index) => {
        console.log(`[${index + 1}] "${item.name}" (${item.current_muscle_group} - ${item.current_subgroup || 'Sem subgrupo'}) -> Motivo: ${item.reason}`);
      });
    }
  } else {
    console.log('\n[Aviso] Executando em modo PREVIEW. Nenhuma gravação foi realizada no banco.');
    console.log('💡 DICA: Para aplicar a migração real, execute:');
    console.log('👉 npx tsx src/lib/exercises/migrateExerciseBiomechanicsApproved.ts --apply\n');
  }
}

// CLI Hook
const isMain = process.argv[1] && (
  process.argv[1].endsWith('migrateExerciseBiomechanicsApproved.ts') ||
  process.argv[1].endsWith('migrateExerciseBiomechanicsApproved.js')
);

if (isMain) {
  runMigration();
}
