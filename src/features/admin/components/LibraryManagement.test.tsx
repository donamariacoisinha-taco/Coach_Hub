// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ state: {} as any, upload: vi.fn() }));
vi.mock('../../../store/adminStore', () => ({ useAdminStore: () => mocks.state }));
vi.mock('../../../services/cloudinaryService', () => ({ cloudinaryService: { uploadStaticFrame: mocks.upload } }));
import LibraryOSV25 from './LibraryOSV25';
import ExerciseEditorV2 from './ExerciseEditorV2';
const exercise = { id:'one',name:'Supino reto',muscle_group:'Peito',type:'free_weight',is_active:true,instructions:'Empurre a barra.' };
beforeEach(() => {
  mocks.state = { exercises:[exercise,{...exercise,id:'two',name:'Agachamento',muscle_group:'Pernas',type:'machine',is_active:false}], loading:false,error:null,isEditorOpen:true,selectedExercise:null,muscleGroups:[],openEditor:vi.fn(),closeEditor:vi.fn(),fetchData:vi.fn(),updateExerciseStatus:vi.fn().mockResolvedValue(undefined),updateExercise:vi.fn().mockResolvedValue(undefined),createExercise:vi.fn().mockResolvedValue(undefined) };
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('Gerenciar biblioteca', () => {
  it('combina filtros e limpa busca, equipamento e situação juntos', () => {
    render(<LibraryOSV25/>);
    fireEvent.change(screen.getByRole('textbox'),{target:{value:'supino'}});
    fireEvent.change(screen.getByLabelText('Equipamento'),{target:{value:'machine'}});
    expect(screen.getByText('Nenhum exercício encontrado')).toBeTruthy();
    fireEvent.click(screen.getByText('Limpar filtros'));
    expect(screen.getByText('Supino reto')).toBeTruthy();
    expect(screen.getByText('Agachamento')).toBeTruthy();
  });
  it('não arquiva sem confirmação', () => {
    vi.spyOn(window,'confirm').mockReturnValue(false);
    render(<LibraryOSV25/>); fireEvent.click(screen.getByText('Arquivar'));
    expect(mocks.state.updateExerciseStatus).not.toHaveBeenCalled();
  });
  it('exige revisão antes de arquivar a seleção', async () => {
    render(<LibraryOSV25/>);
    fireEvent.click(screen.getByLabelText('Selecionar Supino reto'));
    fireEvent.click(screen.getByText('Revisar arquivamento'));
    expect(mocks.state.updateExerciseStatus).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Confirmar arquivamento de 1'));
    await waitFor(() => expect(mocks.state.updateExerciseStatus).toHaveBeenCalledWith('one',false));
    await screen.findByText('1 exercícios arquivados.');
  });
  it('limpa seleção ao mudar filtros para evitar ações sobre itens ocultos', () => {
    render(<LibraryOSV25/>);
    fireEvent.click(screen.getByLabelText('Selecionar Supino reto'));
    expect(screen.getByText('Revisar arquivamento')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Situação'),{target:{value:'hidden'}});
    expect(screen.queryByText('Revisar arquivamento')).toBeNull();
  });
  it('cria rascunho por padrão', async () => {
    render(<ExerciseEditorV2/>);
    fireEvent.change(screen.getByLabelText('Nome do exercício *'),{target:{value:'Novo exercício'}});
    fireEvent.click(screen.getByText('Salvar rascunho'));
    await waitFor(() => expect(mocks.state.createExercise).toHaveBeenCalledWith(expect.objectContaining({name:'Novo exercício',is_active:false})));
  });
  it('bloqueia publicação sem instruções e músculo', () => {
    render(<ExerciseEditorV2/>);
    fireEvent.change(screen.getByLabelText('Nome do exercício *'),{target:{value:'Novo'}});
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Salvar e publicar'));
    expect(screen.getByRole('alert').textContent).toContain('Para publicar');
    expect(mocks.state.createExercise).not.toHaveBeenCalled();
  });
  it('protege rascunho ao fechar e permite continuar editando', () => {
    render(<ExerciseEditorV2/>);
    fireEvent.change(screen.getByLabelText('Nome do exercício *'),{target:{value:'Alteração'}});
    fireEvent.click(screen.getByLabelText('Fechar editor'));
    expect(mocks.state.closeEditor).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Continuar editando'));
    expect((screen.getByLabelText('Nome do exercício *') as HTMLInputElement).value).toBe('Alteração');
  });
  it('mantém imagem temporária e salva seus dois campos de compatibilidade juntos', async () => {
    mocks.state.selectedExercise = exercise;
    render(<ExerciseEditorV2/>);
    fireEvent.click(screen.getByText('Imagem e vídeo'));
    fireEvent.change(screen.getByLabelText('Endereço da imagem'),{target:{value:'https://example.com/nova.png'}});
    expect(mocks.state.updateExercise).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Salvar e publicar'));
    await waitFor(() => expect(mocks.state.updateExercise).toHaveBeenCalledWith('one',expect.objectContaining({image_url:'https://example.com/nova.png',static_frame_url:'https://example.com/nova.png'})));
  });
  it('preserva o formulário após falha ao salvar', async () => {
    mocks.state.createExercise.mockRejectedValue(new Error('Serviço indisponível'));
    render(<ExerciseEditorV2/>);
    fireEvent.change(screen.getByLabelText('Nome do exercício *'),{target:{value:'Rascunho'}});
    fireEvent.click(screen.getByText('Salvar rascunho'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Serviço indisponível'));
    expect(mocks.state.closeEditor).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Nome do exercício *') as HTMLInputElement).value).toBe('Rascunho');
  });
});
