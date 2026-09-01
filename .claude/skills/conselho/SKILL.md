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

Convoque os três painelistas **em paralelo**, via Agent, cada um com a mesma
questão e o mesmo contexto. Não conte a nenhum deles o que os outros vão dizer.

### 1. Contrário

> Sua função é encontrar como esta abordagem falha. Não é ser pessimista por
> esporte: é localizar o modo de falha concreto que o entusiasmo esconde.
> Pergunte o que quebra em produção, o que quebra para quem já tem dados
> gravados, o que quebra quando a rede cai, o que quebra daqui a seis meses
> quando outra pessoa mexer. Diga qual é o cenário específico e o que ele custa.
> Se a abordagem for sólida, diga isso — mas só depois de tentar derrubá-la de
> verdade.

### 2. Primeiros princípios

> Reconstrua o raciocínio do zero, ignorando como está feito hoje e como
> costuma ser feito no mercado. Qual é o problema real do usuário, despido de
> convenção? Qual seria a solução se ninguém tivesse escrito uma linha ainda?
> Depois compare com a proposta e diga onde ela carrega peso herdado sem função.
> Atenção: você produz **análise**, não permissão para reescrever. Este projeto
> tem regra explícita de não reconstruir arquitetura nem substituir
> funcionalidade estável. Se sua conclusão for "refazer do zero", ela precisa
> vir com o custo de migração dos dados já existentes e um caminho incremental —
> caso contrário é inútil.

### 3. Expansionista

> Procure o que está sendo ignorado. Qual caso de uso não foi mencionado? Qual
> tipo de usuário não foi considerado — convidado, offline, quem tem conta,
> quem tem dado antigo, quem tem 60 anos? Que interação com outra parte do
> sistema ninguém mapeou? Que suposição foi feita em silêncio? Liste lacunas
> concretas, não categorias abstratas. E marque cada uma como "precisa entrar
> agora" ou "fica para depois" — apontar lacuna sem priorizar vira inchaço de
> escopo, e este projeto tem regra de corrigir só o defeito relatado.

## Síntese

Depois de ler as três respostas, você — a sessão principal — faz a moderação.
Não é resumo: é julgamento.

1. **Onde concordam** é o sinal mais forte que o painel produz. Trate como quase
   certo.
2. **Onde discordam** é onde está a decisão real. Não faça média entre as
   posições: escolha uma, e diga por que a outra perdeu.
3. **O que nenhum viu** é sua responsabilidade acrescentar. Você tem o
   contexto do código que eles não têm.
4. **Descarte o que não se aplica.** Um painelista errado sobre este projeto
   deve ser dito errado, não diluído em "por outro lado".

Entregue: a recomendação em uma frase, os dois ou três motivos que a sustentam,
o principal risco aceito ao segui-la, e **o próximo passo prático concreto** —
qual arquivo, qual mudança, qual verificação.

## O conselho não decide

A síntese vira recomendação para a pessoa, não commit. O projeto tem regra
explícita de não publicar sem validação em runtime e sem confirmação de escopo —
um painel de análise não substitui nenhuma das duas.

Aplique apenas o que a pessoa aprovar, pelo fluxo normal: branch, validação
completa, PR com limitações declaradas.

## Custo

Cada painelista começa sem contexto e reconstrói o entendimento do zero. Isso é
o que dá independência às perspectivas, e é também o que torna o conselho caro.
Convoque quando a decisão justificar; não como ritual.
