import { Exercise } from '../../../types';

const columns: [string, keyof Exercise][] = [
  ['ID','id'], ['Nome','name'], ['Outro nome','commercial_alias'],
  ['Grupo muscular','muscle_group'], ['ID do grupo muscular','muscle_group_id'],
  ['Tipo de equipamento','type'], ['Equipamento','equipment'],
  ['Nível','difficulty_level'], ['Publicado','is_active'],
  ['Descrição','description'], ['Instruções','instructions'], ['Dicas técnicas','technical_tips'],
  ['Imagem','image_url'], ['Imagem antiga','static_frame_url'], ['Vídeo','video_url'],
];
function csvCell(value: unknown): string {
  let text = value == null ? '' : typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value);
  // Spreadsheet applications must treat catalogue text as text, never as a formula.
  if (/^[\s]*[=+\-@]/u.test(text) || /^[\t\r\n]/u.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g,'""')}"`;
}
export function buildLibraryCsv(exercises: Exercise[]): string {
  return '\uFEFF' + [columns.map(([label]) => csvCell(label)).join(';'),
    ...exercises.map(exercise => columns.map(([,field]) => csvCell(exercise[field])).join(';')),
  ].join('\r\n');
}
export function downloadLibraryCsv(exercises: Exercise[]): void {
  const blob = new Blob([buildLibraryCsv(exercises)],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kyron-exercicios-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);
  try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url),0); }
}
