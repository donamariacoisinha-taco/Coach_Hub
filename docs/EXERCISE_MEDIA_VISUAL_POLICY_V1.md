# KYRON OS — Política Visual de Exercícios v1

Data de aprovação: 2026-07-28  
Status: aprovada para lote piloto

## Objetivo

Padronizar as imagens principais da biblioteca de exercícios e impedir substituições automáticas sem revisão administrativa.

## Referências aprovadas

O padrão foi definido a partir das imagens fornecidas pelo proprietário do KYRON e dos seguintes critérios:

- modelo humano adulto atlético;
- nível intermediário;
- amplitude completa do movimento;
- postura firme, controlada e biomecanicamente correta;
- carga moderada;
- equipamento real e completo;
- músculos principais destacados em azul;
- músculos secundários destacados em verde;
- expressão corporal ativa, sem teatralização;
- foco didático na técnica correta;
- fundo branco;
- ângulo levemente dinâmico;
- ilustração digital anatômica fitness;
- anatomia humana realista e proporcional;
- iluminação profissional;
- alta resolução;
- sem texto, marca-dágua, logotipo ou marca comercial.

## Composição oficial

A imagem deve apresentar, preferencialmente:

1. posição inicial;
2. posição final;
3. quadro anatômico circular complementar quando necessário para explicar os músculos envolvidos.

O enquadramento deve preservar o corpo, o equipamento e a trajetória do exercício. O quadro anatômico não pode substituir a leitura do movimento.

## Proporção e resolução

- proporção: 3:2 horizontal;
- referência editorial: 1536 × 1024;
- geração via Gemini: 2K em proporção 3:2;
- a saída gerada é mantida em resolução superior e exibida pelo aplicativo dentro do padrão 3:2.

## Regras anatômicas

### Azul

Usado exclusivamente para músculos principais ou agonistas definidos no banco.

### Verde

Usado exclusivamente para músculos secundários ou sinergistas definidos no banco.

### Sem destaque

Estabilizadores, antagonistas e músculos não envolvidos não devem receber cor na imagem principal, salvo revisão técnica específica.

## Critérios de reprovação

A candidata deve ser rejeitada quando houver:

- músculo principal ou secundário destacado incorretamente;
- equipamento incompatível ou incompleto;
- empunhadura incorreta;
- postura insegura;
- amplitude incompleta sem justificativa técnica;
- trajetória irreal;
- articulação deformada;
- anatomia desproporcional;
- membros extras;
- duplicação de equipamento;
- texto, setas, números, logotipo ou marca-dágua;
- fundo diferente do branco sem aprovação específica;
- composição confusa ou sem leitura educacional.

## Fluxo de aprovação

1. validar URLs atuais sem alterar imagens;
2. gerar seis pilotos, um por grupo muscular principal quando possível;
3. comparar imagem atual e candidata;
4. aprovar, rejeitar ou solicitar nova geração;
5. liberar lotes de cinco somente após seis pilotos aprovados;
6. manter todas as novas imagens como candidatas;
7. atualizar `exercises.image_url` apenas após aprovação explícita;
8. preservar a URL anterior para rastreabilidade e rollback.

## Grupos do piloto

- Peito;
- Costas;
- Ombros;
- Braços;
- Abdômen;
- Pernas.

## Segurança operacional

- o botão legado `Executar tudo` permanece bloqueado;
- geração exige administrador ativo;
- política visual aprovada é obrigatória;
- lote completo exige aprovação do piloto;
- reprovações humanas não entram em retentativa automática;
- falhas técnicas podem ser recolocadas na fila;
- variantes por sexo e nível permanecem adiadas.
