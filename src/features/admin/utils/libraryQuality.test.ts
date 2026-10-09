import { describe, expect, it, vi } from 'vitest';
import { Exercise } from '../../../types';
import { archiveLibrarySelection, getLibraryReviewIssues } from './libraryQuality';
const exercise = (id:string,name:string,fields:Partial<Exercise> = {}) => ({id,name,muscle_group:'Peito',image_url:'https://example.com/image.png',instructions:'Execute lentamente.',...fields}) as Exercise;
describe('Revisão da biblioteca', () => {
  it('não inventa pendências para cadastro completo', () => {
    expect(getLibraryReviewIssues([exercise('a','Supino')]).get('a')).toEqual([]);
  });
  it('considera imagem antiga e detecta campos vazios', () => {
    const issues = getLibraryReviewIssues([exercise('a','Supino',{image_url:' ',static_frame_url:'https://example.com/antiga.png',instructions:' ',muscle_group:''})]);
    expect(issues.get('a')).toEqual(['Sem instruções','Sem grupo muscular']);
  });
  it('sinaliza nomes normalizados repetidos sem afirmar que são o mesmo exercício', () => {
    const issues = getLibraryReviewIssues([exercise('a','Flexão'),exercise('b','flexao'),exercise('c','Supino')]);
    expect(issues.get('a')).toContain('Nome repetido — conferir');
    expect(issues.get('b')).toContain('Nome repetido — conferir');
    expect(issues.get('c')).toEqual([]);
  });
  it('registra sucesso parcial e continua após erro individual', async () => {
    const archive = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('falha')).mockResolvedValueOnce(undefined);
    expect(await archiveLibrarySelection(['a','b','c'],archive)).toEqual({completed:['a','c'],failed:['b']});
    expect(archive).toHaveBeenCalledTimes(3);
  });
});
