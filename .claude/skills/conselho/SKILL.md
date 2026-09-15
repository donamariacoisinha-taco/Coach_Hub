---
name: conselho
description: Convoca um painel de perspectivas adversariais sobre uma decisão em aberto e sintetiza uma recomendação. Use quando a escolha for de arquitetura, produto ou abordagem — algo que teria custo alto para desfazer — e não para tarefa de execução com caminho claro. Invoque como /conselho <a questão>.
---

# Conselho

Um painel que ataca a mesma questão por ângulos incompatíveis, para expor o que
uma cabeça só não vê. Termina numa recomendação, nunca numa aplicação automática.

## Quando convocar

Convoque quando **desfazer sairia caro**: mudança de arquitetura, formato de
dado persistido, contrato entre telas, mudança de schema no Supabase, alteração
que afeta usuários já existentes, ou escolha de abordagem com dois caminhos
defensáveis.

**Não convoque** para tarefa com caminho claro — corrigir bug relatado,
implementar pedido específico, ajustar texto. Nesses casos o painel só adiciona
latência e produz consenso morno sobre algo que já estava decidido. Se você
consegue nomear o próximo passo sem hesitar, não precisa de conselho.

## Como executar

Formule a questão em uma frase, com o contexto mínimo necessário: qual decisão
está em aberto, qual a abordagem proposta (se houver), e qual a restrição real.

Convoque os seis painelistas **em paralelo**, via Agent, cada um com a mesma
questão e o mesmo contexto. Não conte a nenhum deles o que os outros vão dizer.

### 1. Designer

> Avalie se o design e a experiência propostos estão à altura do que há de
> melhor no mercado para este tipo de produto — não da média, do topo. Use como
> referência principal as diretrizes de design da Apple (Human Interface
> Guidelines) para hierarquia visual, espaçamento, tipografia, feedback e
> clareza de fluxo, e compare com os melhores apps de fitness/saúde quando fizer
> sentido. Aponte onde a proposta fica abaixo desse padrão e o que mudaria para
> chegar lá. O público real deste produto é iniciantes e pessoas 50+, que
> precisam de clareza extrema e poucas ações por tela — não proponha
> sofisticação visual que sacrifique legibilidade por esse público. Se a
> decisão não tem superfície visual nenhuma, diga isso claramente em vez de
> forçar um ângulo de design onde não cabe.

### 2. Contrário

> Sua função é encontrar como esta abordagem falha. Não é ser pessimista por
> esporte: é localizar o modo de falha concreto que o entusiasmo esconde.
> Pergunte o que quebra em produção, o que quebra para quem já tem dados
> gravados, o que quebra quando a rede cai, o que quebra daqui a seis meses
> quando outra pessoa mexer. Diga qual é o cenário específico e o que ele custa.
> Se a abordagem for sólida, diga isso — mas só depois de tentar derrubá-la de
> verdade.

### 3. Primeiros princípios

> Reconstrua o raciocínio do zero, ignorando como está feito hoje e como
> costuma ser feito no mercado. Qual é o problema real do usuário, despido de
> convenção? Qual seria a solução se ninguém tivesse escrito uma linha ainda?
> Depois compare com a proposta e diga onde ela carrega peso herdado sem função.
> Atenção: você produz **análise**, não permissão para reescrever. Este projeto
> tem regra explícita de não reconstruir arquitetura nem substituir
> funcionalidade estável. Se sua conclusão for "refazer do zero", ela precisa
> vir com o custo de migração dos dados já existentes e um caminho incremental —
> caso contrário é inútil.

### 4. Expansionista

> Procure o que está sendo ignorado. Qual caso de uso não foi mencionado? Qual
> tipo de usuário não foi considerado — convidado, offline, quem tem conta,
> quem tem dado antigo, quem tem 60 anos? Que interação com outra parte do
> sistema ninguém mapeou? Que suposição foi feita em silêncio? Liste lacunas
> concretas, não categorias abstratas. E marque cada uma como "precisa entrar
> agora" ou "fica para depois" — apontar lacuna sem priorizar vira inchaço de
> escopo, e este projeto tem regra de corrigir só o defeito relatado.

### 5. Outsider

> Não proponha solução — interrogue a pergunta. Esqueça o histórico do projeto,
> a convenção do setor de apps de treino e "como sempre se fez" por aqui. Se
> você chegasse agora, sem bagagem nenhuma, que suposição embutida na forma como
> a questão foi colocada saltaria aos olhos? Que convenção está sendo seguida só
> por hábito, sem ninguém ter perguntado recentemente se ainda faz sentido? Onde
> o enquadramento da decisão já decidiu metade da resposta antes de a pergunta
> ser feita? Isto é diferente do painelista de primeiros princípios: ele
> reconstrói a solução; você questiona se a pergunta em si está bem colocada.

### 6. Executor

> Sua função não é julgar se a ideia é boa — é dizer exatamente o que fazer
> amanhã de manhã se a resposta for "sim, seguir". Qual o primeiro arquivo que
> muda, qual a ordem de execução que reduz risco (o que validar primeiro para
> conseguir abortar barato se estiver errado), o que dá para entregar em uma
> tarde e o que precisa de dias. Se a proposta como está não dá para quebrar em
> passos concretos, diga isso — é sinal de que a decisão não está madura o
> suficiente para ser executada ainda, não invente um plano só para preencher a
> resposta.

## Síntese

Depois de ler as seis respostas, você — a sessão principal — faz a moderação.
Não é resumo: é julgamento.

1. **Onde concordam** é o sinal mais forte que o painel produz. Trate como quase
   certo.
2. **Onde discordam** é onde está a decisão real. Não faça média entre as
   posições: escolha uma, e diga por que a outra perdeu.
3. **O que nenhum viu** é sua responsabilidade acrescentar. Você tem o
   contexto do código que eles não têm.
4. **Descarte o que não se aplica.** Um painelista errado sobre este projeto
   deve ser dito errado, não diluído em "por outro lado" — isso vale em
   especial para Designer (quando a decisão não tem superfície visual) e
   Outsider (quando a convenção que ele questiona já foi de fato repensada
   recentemente, não só seguida por hábito).

Entregue: a recomendação em uma frase, os dois ou três motivos que a sustentam,
o principal risco aceito ao segui-la, e **o próximo passo prático concreto** —
qual arquivo, qual mudança, qual verificação. Use a resposta do Executor como
ponto de partida desse passo, não como veredito final: ele planeja execução,
você ainda decide se a execução deve acontecer.

## O conselho não decide

A síntese vira recomendação para a pessoa, não commit. O projeto tem regra
explícita de não publicar sem validação em runtime e sem confirmação de escopo —
um painel de análise não substitui nenhuma das duas.

Aplique apenas o que a pessoa aprovar, pelo fluxo normal: branch, validação
completa, PR com limitações declaradas.

## Custo

Cada painelista começa sem contexto e reconstrói o entendimento do zero. Isso é
o que dá independência às perspectivas, e é também o que torna o conselho caro
— com seis painelistas, mais ainda. Convoque quando a decisão justificar; não
como ritual. Se a questão é claramente de produto/arquitetura mas sem nenhuma
superfície visual, considere dispensar o Designer da convocação em vez de
convocá-lo só para responder "não se aplica".
