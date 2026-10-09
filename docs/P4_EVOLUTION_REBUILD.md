# Evolução — experiência e contrato de métricas

Implementação: 2026-10-09.

## Organização

- Resumo: sessões, exercícios e séries registradas; primeiro versus último resultado no período, sem ranking de força entre movimentos diferentes.
- Exercícios: busca sem diferenciar acentos, seletor dos movimentos registrados, gráfico com datas/unidades e registros de origem.
- Histórico: sessões completas/parciais, detalhes, edição, compartilhamento e exclusão existentes.
- Medidas e fotos: acesso secundário preservando os módulos corporais existentes.
- Períodos: 30 dias, 90 dias e todo o histórico; resumo e exercícios compartilham o filtro enquanto se navega entre essas duas áreas.

## Regras dos dados

A fonte é o histórico concluído do usuário e suas séries, não a view agregada `exercise_progress`. Contas usam consultas paginadas e filtradas pelo usuário autenticado. Convidados usam o armazenamento local existente. Sessões órfãs e registros fora do histórico visível são descartados.

`evolutionMetrics.ts` concentra agrupamento por exercício/sessão, corte temporal, recordes e diferenças. Datas são as de conclusão da sessão, com apresentação no fuso do aparelho. Sessões parciais entram apenas com seus registros efetivos e ficam identificadas. Séries marcadas explicitamente como aquecimento são excluídas.

- Carga máxima: maior carga positiva com repetições inteiras e positivas; exibe as repetições daquela série.
- Repetições: maior número válido registrado em uma série, incluindo séries sem carga.
- Volume: soma de carga × repetições válidas; ausência e zero nunca viram dez repetições.
- 1RM estimado: fórmula de Epley para 2–12 repetições; uma repetição usa a própria carga. Apresentado como estimativa, separado da carga registrada.
- Recorde no período: melhor valor no período selecionado.
- Último resultado: sessão mais recente no período, mesmo que inferior ao recorde.
- Variação: último menos primeiro valor disponível no período; exige duas sessões comparáveis e preserva o sinal negativo. Não usa resultados de fora do intervalo como fallback.
- Sem carga mensurável: apresentar repetições; não inferir peso corporal, assistência, tempo ou distância. Métricas de tempo/distância dependem de registros específicos, não de repetições ou duração total do treino.

Redução de carga não é automaticamente classificada como foco na técnica. Volume maior não é apresentado como prova de aumento de força. Não há sequência fictícia nem fator arbitrário para classificar exercícios compostos.

## Estados e atualização

Carregamento, falha e ausência são distintos; falha oferece nova tentativa. Respostas de solicitações antigas são ignoradas após mudança de dados. Edição e exclusão invalidam os resultados. Consultas não gravam nem alteram séries existentes.

O player não teve seu design alterado. Não foram adicionadas funcionalidades de IA.

## Validação

Testes cobrem períodos reais, ausência/zero, peso corporal, volume, carga versus estimativa, exclusão de órfãos e aquecimento, paginação acima de 1.000 séries, filtro por usuário, falhas visíveis, navegação resumo → exercício e respostas atrasadas.
