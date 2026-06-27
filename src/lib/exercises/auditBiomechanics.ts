import { supabase } from '../api/supabase';
import { getExerciseBiomechanics, MAIN_GROUPS } from './exerciseTaxonomy';
import { Exercise } from '../../types';

export async function runBiomechanicsAudit() {
  console.log('\n======================================================');
  console.log('   KYRON OS — AUDITORIA DE COBERTURA BIOMECÂNICA 2.0  ');
  console.log('======================================================');

  // 1. Fetch exercises from Supabase
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name');

  if (error) {
    console.error('[-] Erro ao carregar exercícios do banco de dados:', error);
    return;
  }

  if (!exercises || exercises.length === 0) {
    console.log('[-] Nenhum exercício encontrado na tabela.');
    return;
  }

  const total = exercises.length;
  let hasRealBiomechanics = 0;
  let reliesOnFallback = 0;
  const suspiciousClassifications: Array<{ id: string; name: string; reason: string }> = [];
  const groupCoverage: Record<string, { total: number; filled: number }> = {};

  // Initialize group coverage counter
  MAIN_GROUPS.forEach(g => {
    groupCoverage[g] = { total: 0, filled: 0 };
  });

  exercises.forEach((ex: Exercise) => {
    const isDbFilled = ex.biomechanics !== null && ex.biomechanics !== undefined;
    if (isDbFilled) {
      hasRealBiomechanics++;
    } else {
      reliesOnFallback++;
    }

    // Get final resolved biomechanics (either real or fallback estimated)
    const bio = getExerciseBiomechanics(ex);
    const grp = bio.primary_group;

    if (!groupCoverage[grp]) {
      groupCoverage[grp] = { total: 0, filled: 0 };
    }
    groupCoverage[grp].total++;
    if (isDbFilled) {
      groupCoverage[grp].filled++;
    }

    // Biomechanical Suspicion Auditing
    const nameLower = ex.name.toLowerCase();
    
    // Check 1: Generic muscle group without a specific sub-group agonist
    if (bio.agonist_muscles.length === 0 || bio.agonist_muscles.includes('Mobilidade articular')) {
      if (['pernas', 'braços', 'costas', 'peitoral'].includes(grp.toLowerCase())) {
        suspiciousClassifications.push({
          id: ex.id,
          name: ex.name,
          reason: `Falta de subgrupo específico (Agonista mapeado apenas como genérico ou vazio)`
        });
      }
    }

    // Check 2: Potential misclassifications
    if (grp === 'Peitoral' && (nameLower.includes('biceps') || nameLower.includes('triceps') || nameLower.includes('agachamento'))) {
      suspiciousClassifications.push({
        id: ex.id,
        name: ex.name,
        reason: `Músculo principal 'Peitoral' mas nome sugere '${ex.name}'`
      });
    }
    
    if (grp === 'Pernas' && (nameLower.includes('supino') || nameLower.includes('crucifixo') || nameLower.includes('rosca'))) {
      suspiciousClassifications.push({
        id: ex.id,
        name: ex.name,
        reason: `Músculo principal 'Pernas' mas nome sugere parte superior`
      });
    }

    // Check 3: Missing equipment info
    if (!ex.equipment || ex.equipment === 'Não especificado') {
      suspiciousClassifications.push({
        id: ex.id,
        name: ex.name,
        reason: `Sem especificação de Equipamento (equipment nulo ou genérico)`
      });
    }
  });

  // Calculate percentages
  const pctReal = ((hasRealBiomechanics / total) * 100).toFixed(1);
  const pctFallback = ((reliesOnFallback / total) * 100).toFixed(1);

  console.log(`\n📊 COBERTURA GLOBAL:`);
  console.log(`- Total de exercícios cadastrados: ${total}`);
  console.log(`- Com biomechanics preenchido no banco: ${hasRealBiomechanics} (${pctReal}%)`);
  console.log(`- Dependendo de fallback dinâmico: ${reliesOnFallback} (${pctFallback}%)`);

  console.log(`\n📈 COBERTURA POR GRUPO PRINCIPAL:`);
  Object.entries(groupCoverage).forEach(([grp, stats]) => {
    const pct = stats.total > 0 ? ((stats.filled / stats.total) * 100).toFixed(1) : '0.0';
    console.log(`- ${grp.padEnd(12)}: ${stats.filled}/${stats.total} preenchidos (${pct}% cobertura)`);
  });

  console.log(`\n⚠️ SINALIZAÇÃO DE CLASSIFICAÇÃO SUSPEITA OU INCOMPLETA (Amostra de max 15):`);
  if (suspiciousClassifications.length === 0) {
    console.log(`[+] Tudo limpo! Nenhuma classificação suspeita encontrada.`);
  } else {
    suspiciousClassifications.slice(0, 15).forEach((item, idx) => {
      console.log(`[${idx + 1}] Exercício: "${item.name}" (ID: ${item.id})`);
      console.log(`    Razão: ${item.reason}`);
    });
    if (suspiciousClassifications.length > 15) {
      console.log(`    ... e mais ${suspiciousClassifications.length - 15} itens suspeitos.`);
    }
  }

  console.log('\n======================================================');
  console.log('               FIM DO RELATÓRIO DE AUDITORIA           ');
  console.log('======================================================\n');
}

// Allow executing directly via command-line
const isMain = process.argv[1] && (
  process.argv[1].endsWith('auditBiomechanics.ts') ||
  process.argv[1].endsWith('auditBiomechanics.js')
);

if (isMain) {
  runBiomechanicsAudit();
}
