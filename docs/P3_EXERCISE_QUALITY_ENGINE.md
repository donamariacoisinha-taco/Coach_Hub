# P3 — Motor de Qualidade Técnica dos Exercícios

## Objetivo

Substituir a nota baseada quase exclusivamente na presença de imagem por uma avaliação técnica multidimensional e auditável.

## Dimensões

| Dimensão | Peso máximo |
|---|---:|
| Anatomia e músculos | 25 |
| Técnica e amplitude | 20 |
| Segurança | 15 |
| Equipamento | 10 |
| Taxonomia | 10 |
| Busca e classificação | 10 |
| Mídia | 10 |

A ausência de imagem reduz somente a dimensão de mídia. Um exercício tecnicamente consistente pode ser aprovado com ressalva de mídia.

## Estrutura de banco

- `exercise_quality_runs`: histórico de execuções;
- `exercise_quality_assessments`: notas e problemas por exercício;
- `exercise_quality_proposals`: correções propostas, confiança, risco e decisão;
- `exercise_quality_dashboard`: resumo administrativo;
- `refresh_exercise_quality_engine()`: nova execução administrativa;
- `review_exercise_quality_proposal(...)`: aprovação ou rejeição individual;
- `apply_safe_exercise_quality_proposals()`: aplicação em lote apenas de correções seguras;
- `find_exercise_substitutes(...)`: alternativas compatíveis;
- `rank_exercises_for_protocol(...)`: ranking para construção de protocolos.

## Segurança

- RLS restrita a administradores;
- a auditoria não altera automaticamente `exercises`;
- somente propostas `safe`, com confiança mínima, entram no lote automático;
- propostas moderadas exigem decisão individual;
- toda aplicação grava snapshot anterior e posterior em `exercise_change_log`;
- imagens permanecem fora desta etapa.

## Diagnóstico inicial

A primeira execução avaliou 148 exercícios e encontrou:

- anatomia e taxonomia estruturalmente completas;
- instruções genéricas em grande parte da biblioteca;
- dicas técnicas genéricas em todos os registros;
- divergências de equipamento que precisam ser separadas entre erro real e descrição genérica;
- 49 pendências de imagem, tratadas separadamente.

## Integração com protocolos

O carregamento administrativo da biblioteca incorpora a nota técnica e prioriza os exercícios melhor avaliados. A função de ranking também permite filtrar por grupo muscular, subgrupo, equipamento e dificuldade.

## Substituição inteligente

O ranking de substitutos considera:

- mesmo grupo muscular;
- mesmo subgrupo;
- mesmo padrão de movimento;
- mesmo plano;
- dificuldade;
- músculos agonistas em comum;
- qualidade técnica atual;
- equipamentos disponíveis.

Nenhum protocolo existente é modificado automaticamente.
