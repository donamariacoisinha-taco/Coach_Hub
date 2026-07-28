import { describe, expect, it } from 'vitest';
import {
  buildOfficialExerciseImagePrompt,
  type ExerciseMediaPolicy,
} from './exerciseMediaApprovalProcessor';

describe('exerciseMediaApprovalProcessor', () => {
  it('inclui as regras anatômicas oficiais e os dados do exercício', () => {
    const policy: ExerciseMediaPolicy = {
      id: 'policy-1',
      name: 'KYRON Anatomia Educacional 3:2',
      version: 1,
      status: 'approved',
      criteria: {},
      prompt_template: 'Ilustração profissional em fundo branco.',
      aspect_ratio: '3:2',
      image_size: '2K',
      target_width: 1536,
      target_height: 1024,
      require_manual_approval: true,
      pilot_required: 6,
      pilot_approved: false,
      approved_at: '2026-07-28T00:00:00.000Z',
    };

    const prompt = buildOfficialExerciseImagePrompt(
      policy,
      {
        id: 'exercise-1',
        name: 'Rosca direta com barra W',
        muscle_group: 'Braços',
        subgroup: 'Bíceps',
        equipment: 'Barra W',
        image_url: null,
        technical_prompt: 'Cotovelos próximos ao tronco.',
        biomechanics: {
          primary_muscles: ['Bíceps braquial'],
          secondary_muscles: ['Braquial', 'Braquiorradial'],
        },
      } as any,
      'Amplitude completa.',
    );

    expect(prompt).toContain('Rosca direta com barra W');
    expect(prompt).toContain('Barra W');
    expect(prompt).toContain('músculos principais devem estar em azul');
    expect(prompt).toContain('músculos secundários, em verde');
    expect(prompt).toContain('posição inicial');
    expect(prompt).toContain('posição final');
  });
});
