import { supabase } from '../api/supabase';
import { getExerciseBiomechanics } from './exerciseTaxonomy';
import { Exercise, ExerciseBiomechanics } from '../../types';
import * as fs from 'fs';
import * as path from 'path';

export interface AuditItem {
  id: string;
  name: string;
  current_muscle_group: string;
  current_subgroup: string;
  current_equipment: string;
  image_url_exists: boolean;
  suggested_biomechanics: ExerciseBiomechanics;
  confidence: 'high' | 'medium' | 'low' | 'critical';
  reason: string;
  alerts: string[];
}

export interface AggregatedReport {
  total_analyzed: number;
  confidence_stats: {
    high: number;
    medium: number;
    low: number;
    critical: number;
  };
  critical_items: Array<{ id: string; name: string; reason: string }>;
  insufficient_data_items: Array<{ id: string; name: string; missing: string[] }>;
  problematic_groups: Record<string, number>;
  missing_equipment_count: number;
  missing_image_count: number;
}

export async function runDryRunBiomechanics() {
  console.log('=== [DRY-RUN] INICIANDO MIGRAÇÃO BIOMECÂNICA EXERCÍCIOS 2.0 ===');
  console.log('[Info] Carregando exercícios do banco de dados...');

  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name');

  if (error) {
    console.error('[-] Erro ao carregar exercícios para o dry-run:', error);
    return;
  }

  if (!exercises || exercises.length === 0) {
    console.warn('[!] Nenhum exercício cadastrado no banco de dados.');
    return;
  }

  const items: AuditItem[] = [];
  const critical_items: Array<{ id: string; name: string; reason: string }> = [];
  const insufficient_data_items: Array<{ id: string; name: string; missing: string[] }> = [];
  const problematic_groups: Record<string, number> = {};
  
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let criticalCount = 0;
  let missingEqCount = 0;
  let missingImgCount = 0;

  exercises.forEach((ex: any) => {
    const rawName = ex.name || '';
    const nameLower = rawName.toLowerCase();
    const rawMg = ex.muscle_group || '';
    const rawSub = ex.subgroup || '';
    const rawEq = ex.equipment || '';
    const hasImg = !!(ex.image_url || ex.thumbnail_url);
    const hasDesc = !!(ex.description || ex.instructions);

    if (!hasImg) missingImgCount++;
    if (!rawEq || rawEq === 'Não especificado') missingEqCount++;

    // Calculate dynamic biomechanics
    const suggested_biomechanics = getExerciseBiomechanics(ex as Exercise);

    // Initial estimation of Confidence Level and Reasons
    let confidence: 'high' | 'medium' | 'low' | 'critical' = 'high';
    const alerts: string[] = [];
    const reasonsList: string[] = [];

    // Detect critical inconsistency anomalies (critical)
    let isCritical = false;
    let criticalReason = '';

    // 1. Apoio fechado / Apoio reto (fechado) mapped as "Glúteos/Abdutores" or similar in old db subgroup
    if (nameLower.includes('apoio') && (rawSub.toLowerCase().includes('glúteo') || rawSub.toLowerCase().includes('abdutores'))) {
      isCritical = true;
      criticalReason = 'Exercício de empurrar ("Apoio") classificado incorretamente no subgrupo "Glúteos/Abdutores".';
    }

    // 2. Mesa flexora mapped as "Abdômen"
    if (nameLower.includes('flexora') && (rawMg.toLowerCase().includes('abdômen') || rawMg.toLowerCase().includes('abdomen') || rawSub.toLowerCase().includes('abdômen') || rawSub.toLowerCase().includes('abdomen'))) {
      isCritical = true;
      criticalReason = 'Mesa flexora (flexão de joelhos) classificada incorretamente como "Abdômen".';
    }

    // 3. Chest exercise under arms
    if ((nameLower.includes('supino') || nameLower.includes('crucifixo') || nameLower.includes('peito')) && rawMg.toLowerCase() === 'braços' && !nameLower.includes('fechado') && !nameLower.includes('triceps')) {
      isCritical = true;
      criticalReason = 'Exercício focado em Peitoral classificado no grupo genérico "Braços".';
    }

    // 4. Leg exercise with upper body muscle group
    if ((nameLower.includes('agachamento') || nameLower.includes('leg press') || nameLower.includes('extensora') || nameLower.includes('flexora') || nameLower.includes('stiff')) && 
        ['peito', 'braços', 'bíceps', 'tríceps', 'ombros', 'costas', 'abdômen'].includes(rawMg.toLowerCase())) {
      isCritical = true;
      criticalReason = `Exercício de membro inferior ("${rawName}") com grupo muscular superior ("${rawMg}").`;
    }

    if (isCritical) {
      confidence = 'critical';
      alerts.push(criticalReason);
      reasonsList.push('[Crítico] Inconsistência anatômica gritante nos dados antigos.');
      critical_items.push({ id: ex.id, name: rawName, reason: criticalReason });
      problematic_groups[rawMg] = (problematic_groups[rawMg] || 0) + 1;
    } else {
      // Evaluate other confidence levels
      const missingFields: string[] = [];
      if (!rawSub) missingFields.push('subgroup');
      if (!rawEq || rawEq === 'Não especificado') missingFields.push('equipment');
      if (!hasDesc) missingFields.push('description/instructions');

      if (missingFields.length > 0) {
        insufficient_data_items.push({ id: ex.id, name: rawName, missing: missingFields });
      }

      // If missing major identifiers -> low confidence
      if (!rawSub && (!rawEq || rawEq === 'Não especificado')) {
        confidence = 'low';
        reasonsList.push('Classificação genérica: sem subgrupo e sem equipamento especificado.');
      } else if (!rawSub) {
        confidence = 'medium';
        reasonsList.push('Subgrupo não especificado; inferido com base no nome do exercício.');
      } else {
        confidence = 'high';
        reasonsList.push('Mapeamento preciso com base em correspondência direta de grupo, subgrupo e nome.');
      }
    }

    // Increment stats
    if (confidence === 'high') highCount++;
    else if (confidence === 'medium') mediumCount++;
    else if (confidence === 'low') lowCount++;
    else if (confidence === 'critical') criticalCount++;

    items.push({
      id: ex.id,
      name: rawName,
      current_muscle_group: rawMg,
      current_subgroup: rawSub,
      current_equipment: rawEq,
      image_url_exists: hasImg,
      suggested_biomechanics,
      confidence,
      reason: reasonsList.join(' '),
      alerts
    });
  });

  // Build aggregated report
  const report: AggregatedReport = {
    total_analyzed: exercises.length,
    confidence_stats: {
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      critical: criticalCount
    },
    critical_items,
    insufficient_data_items,
    problematic_groups,
    missing_equipment_count: missingEqCount,
    missing_image_count: missingImgCount
  };

  // Write dry-run file to root folder for manual review
  const reportPath = path.join(process.cwd(), 'exercise_biomechanics_dry_run_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ summary: report, exercises: items }, null, 2), 'utf-8');

  console.log(`\n======================================================`);
  console.log(`📊 [SUMMARY] RELATÓRIO DO DRY-RUN DE AUDITORIA BIOMECÂNICA`);
  console.log(`======================================================`);
  console.log(`- Total de exercícios analisados: ${report.total_analyzed}`);
  console.log(`- Alta confiança (High)         : ${report.confidence_stats.high}`);
  console.log(`- Média confiança (Medium)     : ${report.confidence_stats.medium}`);
  console.log(`- Baixa confiança (Low)         : ${report.confidence_stats.low}`);
  console.log(`- Alertas críticos (Critical)    : ${report.confidence_stats.critical}`);
  console.log(`- Exercícios sem equipamento    : ${report.missing_equipment_count}`);
  console.log(`- Exercícios sem imagem         : ${report.missing_image_count}`);
  console.log(`======================================================`);

  if (critical_items.length > 0) {
    console.log(`\n🚨 DETALHES DE ITENS COM ALERTAS CRÍTICOS:`);
    critical_items.forEach((item, idx) => {
      console.log(`[${idx + 1}] "${item.name}" (ID: ${item.id}) -> ${item.reason}`);
    });
  }

  console.log(`\n💾 Arquivo gerado com sucesso: ${reportPath}`);
  console.log(`======================================================\n`);
}

// Command line execution hook
const isMain = process.argv[1] && (
  process.argv[1].endsWith('dryRunExerciseBiomechanics.ts') ||
  process.argv[1].endsWith('dryRunExerciseBiomechanics.js')
);

if (isMain) {
  runDryRunBiomechanics();
}
