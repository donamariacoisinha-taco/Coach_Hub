import { describe, expect, it } from 'vitest';
import { Exercise } from '../../../types';
import { buildLibraryCsv } from './libraryCsv';
const exercise = (fields: Partial<Exercise>) => ({id:'one',name:'Supino',is_active:false,...fields}) as Exercise;
describe('Exportação CSV da biblioteca', () => {
  it('preserva acentos, quebras de linha, aspas e separadores', () => {
    const csv = buildLibraryCsv([exercise({name:'Flexão; "fechada"',instructions:'Linha 1\nLinha 2'})]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Flexão; ""fechada"""');
    expect(csv).toContain('"Linha 1\nLinha 2"');
    expect(csv).toContain('"Não"');
  });
  it('exporta apenas os exercícios recebidos', () => {
    const csv = buildLibraryCsv([exercise({id:'chosen',name:'Escolhido'})]);
    expect(csv).toContain('"chosen"');
    expect(csv.split('\r\n')).toHaveLength(2);
  });
  it('neutraliza fórmulas sem executar conteúdo da célula', () => {
    const csv = buildLibraryCsv([exercise({name:'=HYPERLINK("https://example.com")',description:' @SUM(1)'})]);
    expect(csv).toContain('"\'=HYPERLINK');
    expect(csv).toContain('"\' @SUM(1)"');
  });
  it('mantém cabeçalho válido para resultado vazio e campos opcionais vazios', () => {
    expect(buildLibraryCsv([]).split('\r\n')).toHaveLength(1);
    expect(buildLibraryCsv([exercise({})])).not.toContain('undefined');
  });
});
