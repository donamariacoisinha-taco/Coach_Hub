# KYRON OS — Auditoria da Biblioteca de Exercícios

Data: 2026-07-28  
Projeto Supabase: `eqnkuqkadtywgfsoilpe`

## Objetivo

Auditar e corrigir a biblioteca de exercícios com foco em:

- informações ausentes;
- músculos-alvo e músculos secundários;
- estabilizadores e antagonistas;
- taxonomia muscular;
- imagens principais;
- variantes por sexo e nível;
- rastreabilidade e rollback.

## Resultado da auditoria inicial

A base possuía 158 registros de exercícios e apresentava:

- 149 sem instruções;
- 157 sem descrição;
- 158 sem dicas técnicas;
- 54 sem imagem principal;
- 20 sem biomecânica estruturada;
- 20 sem vínculo por `muscle_group_id`;
- grupos musculares duplicados ou hierarquicamente inconsistentes;
- exercícios duplicados apenas por capitalização ou erro de digitação;
- variantes incompletas.

## Proteções criadas

Foram criadas estruturas permanentes de auditoria:

- `exercise_audit_runs`;
- `exercise_audit_backups`;
- `exercise_audit_items`;
- `exercise_change_log`;
- `exercise_taxonomy_backups`;
- `exercise_media_queue`;
- `exercise_media_queue_summary`.

As tabelas de auditoria usam RLS e são restritas a administradores ativos.

## Correções aplicadas

### Integridade estrutural

- 139 exercícios receberam campos derivados da biomecânica já existente;
- 90 variantes ausentes foram criadas;
- todos os exercícios passaram a possuir as seis combinações de sexo e nível;
- o trigger `tr_protect_global_library` foi preservado e reativado após cada migração.

### Consolidação de duplicados

Foram consolidados registros equivalentes, com transferência dos vínculos de:

- fichas de treino;
- logs de séries;
- recordes pessoais;
- favoritos;
- templates;
- protocolos premium;
- sessões parciais;
- preferências administrativas;
- registros de decisão EKE.

Os registros redundantes foram arquivados e desativados, sem exclusão física, para preservar rastreabilidade.

### Biomecânica e conteúdo

A biblioteca canônica passou a possuir, para todos os exercícios:

- grupo muscular principal;
- músculos agonistas;
- músculos sinergistas;
- músculos estabilizadores;
- músculos antagonistas;
- padrão de movimento;
- equipamento;
- ações articulares;
- tags;
- descrição;
- instruções;
- dicas técnicas;
- plano de movimento;
- objetivo de treinamento;
- prompt técnico para imagem.

### Taxonomia muscular

A taxonomia foi consolidada em seis grupos principais:

1. Peito;
2. Costas;
3. Ombros;
4. Braços;
5. Abdômen;
6. Pernas.

Os detalhes anatômicos permanecem em `subgroup` e nos grupos filhos.

## Estado canônico após a correção

- exercícios canônicos ativos: 148;
- biomecânica ausente: 0;
- descrição ausente: 0;
- instruções ausentes: 0;
- dicas técnicas ausentes: 0;
- equipamento ausente: 0;
- subgrupo ausente: 0;
- padrão de movimento ausente: 0;
- plano ausente: 0;
- objetivo de treinamento ausente: 0;
- vínculo muscular ausente: 0;
- imagens principais ausentes: 49.

Distribuição dos exercícios:

- Peito: 20;
- Costas: 24;
- Ombros: 17;
- Braços: 35;
- Abdômen: 12;
- Pernas: 40.

## Automação das imagens

A fila possui:

- 49 imagens principais para geração;
- 99 imagens existentes para validação;
- 888 variantes visuais adiadas até confirmação de uso funcional.

O processador:

1. valida URLs atuais;
2. move imagens inválidas para substituição;
3. gera imagens técnicas com Gemini;
4. envia os arquivos ao bucket `exercise-images`;
5. atualiza `exercises.image_url`;
6. atualiza qualidade e data de revisão;
7. registra falhas e permite retomada.

## Segurança operacional

- endpoints exigem sessão válida;
- endpoints exigem administrador ativo em `user_access`;
- processamento limitado a cinco itens por lote;
- falhas não interrompem toda a fila;
- após três falhas, o item vai para revisão;
- imagens geradas são armazenadas no Supabase Storage;
- nenhuma chave privilegiada é enviada ao navegador.

## Operação pelo painel

No Painel Admin:

1. abrir **Exercícios**;
2. localizar **Auditoria automática de mídia**;
3. clicar em **Executar tudo**;
4. manter a tela aberta enquanto os lotes são processados;
5. usar **Recolocar falhas na fila** apenas quando necessário.

As variantes por sexo e nível permanecem em estado `deferred` para evitar processamento sem benefício comprovado para a interface atual.
