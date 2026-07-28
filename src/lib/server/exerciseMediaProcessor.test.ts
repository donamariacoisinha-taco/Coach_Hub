import { describe, expect, it } from 'vitest';
import {
  clampMediaBatchLimit,
  extractGeneratedInlineImage,
} from './exerciseMediaProcessor';

describe('exerciseMediaProcessor', () => {
  describe('clampMediaBatchLimit', () => {
    it('usa três itens quando o valor é inválido', () => {
      expect(clampMediaBatchLimit(undefined)).toBe(3);
      expect(clampMediaBatchLimit('invalid')).toBe(3);
    });

    it('limita o lote entre um e cinco', () => {
      expect(clampMediaBatchLimit(0)).toBe(1);
      expect(clampMediaBatchLimit(2.9)).toBe(2);
      expect(clampMediaBatchLimit(50)).toBe(5);
    });
  });

  describe('extractGeneratedInlineImage', () => {
    it('extrai inlineData de uma resposta com candidates', () => {
      const payload = Buffer.from('fake-image').toString('base64');
      const result = extractGeneratedInlineImage({
        candidates: [
          {
            content: {
              parts: [
                { text: 'imagem gerada' },
                { inlineData: { mimeType: 'image/png', data: payload } },
              ],
            },
          },
        ],
      });

      expect(result.mimeType).toBe('image/png');
      expect(Buffer.from(result.bytes).toString()).toBe('fake-image');
    });

    it('aceita inline_data em respostas alternativas', () => {
      const payload = Buffer.from('webp-image').toString('base64');
      const result = extractGeneratedInlineImage({
        parts: [
          { inline_data: { mime_type: 'image/webp', data: payload } },
        ],
      });

      expect(result.mimeType).toBe('image/webp');
      expect(Buffer.from(result.bytes).toString()).toBe('webp-image');
    });

    it('falha quando não existe imagem utilizável', () => {
      expect(() => extractGeneratedInlineImage({ candidates: [] }))
        .toThrow('O modelo não retornou uma imagem utilizável.');
    });
  });
});
