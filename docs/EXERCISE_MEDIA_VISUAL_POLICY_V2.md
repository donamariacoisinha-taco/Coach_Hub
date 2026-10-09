# KYRON OS — Padrão de imagens de exercícios v2

Data: 2026-10-09. Status: padrão aprovado pelo proprietário para futuras criações.

Esta política registra a configuração das ilustrações originais usadas na correção da biblioteca em outubro de 2026. Substitui as orientações visuais da v1. O objetivo é identificar claramente o exercício, seu equipamento e sua execução, inclusive nas miniaturas.

## Configuração para novas criações

| Elemento | Padrão |
| --- | --- |
| Formato | Quadrado, proporção 1:1, alta resolução; referência 1024 × 1024 ou superior |
| Estilo | Ilustração digital realista de fitness, com anatomia proporcional e acabamento limpo |
| Fundo | Branco, iluminação uniforme e sombra discreta de contato |
| Modelo | Pessoa adulta, atlética, camiseta cinza, shorts azuis; aparência consistente entre imagens |
| Calçado | Tênis neutro; pés descalços em mobilidade quando apropriado ao movimento |
| Equipamento | Exatamente o equipamento e a variante cadastrados, com apoio, cabos e acessórios visíveis |
| Enquadramento | Corpo e equipamento essenciais inteiros, com margem para a miniatura; ângulo que esclareça o movimento |
| Composição | Uma pose representativa; duas poses lado a lado quando início e fim forem necessários para distinguir movimentos |
| Elementos adicionais | Sem texto, números, setas, logotipos, marcas comerciais ou marca-d’água |
| Músculos | Sem cores anatômicas ou quadro circular como padrão; roupa azul não representa destaque muscular |

Abdução e adução no cabo são referências para composições em duas poses: a abdução afasta a perna da linha média; a adução aproxima ou cruza a perna em direção à linha média. A tornozeleira deve estar na perna correta, ligada à polia baixa. Não reutilizar a mesma imagem para esses dois exercícios.

## Prompt reutilizável

```text
Crie uma ilustração didática realista para a biblioteca de exercícios do KYRON OS.
Exercício: [NOME EXATO]. Variante: [VARIANTE]. Equipamento: [EQUIPAMENTO].
Execução cadastrada: [DESCRIÇÃO VALIDADA].
Pessoa adulta atlética, camiseta cinza, shorts azuis, aparência consistente com a série.
Fundo branco, iluminação uniforme, sombra de contato discreta, proporção quadrada 1:1,
alta resolução. Mostrar [UMA POSE REPRESENTATIVA / DUAS POSES DE INÍCIO E FIM].
Enquadrar todo o corpo e o equipamento necessário, sem cortar mãos, pés ou acessórios.
Detalhes obrigatórios: [APOIOS, EMPUNHADURA, PERNA ATIVA, CABO, TRAJETÓRIA].
Anatomia proporcional, articulações coerentes e equipamento funcional.
Sem texto, números, setas, logotipos, marcas comerciais, marca-d’água ou destaques musculares.
```

Preencher os campos com os dados reais do exercício antes de gerar. Se o cadastro for ambíguo, resolver a variante antes de criar a imagem.

## Conferência obrigatória

1. Comparar imagem, nome, variante, equipamento e descrição cadastrados.
2. Conferir apoios, empunhadura, articulações, perna ativa e conexão dos cabos.
3. Rejeitar membros extras, mãos deformadas, equipamentos duplicados ou trajetórias impossíveis.
4. Verificar legibilidade tanto na imagem inteira quanto na miniatura da biblioteca.
5. Conferir se movimentos parecidos continuam distinguíveis: abdução/adução, extensão/flexão, puxada/remada e variantes de equipamentos.
6. Regerar qualquer candidata incorreta. Uma imagem bonita não comprova execução correta.

## Fontes externas e direitos de uso

Uma ilustração externa pode ser usada quando corresponde exatamente ao exercício e possui licença compatível. Os arquivos flat WebP da RepDB usados nesta correção são uma exceção visual existente; novas criações originais seguem a configuração acima.

Para RepDB, manter o crédito visível [Exercise data by RepDB (repdb.co)](https://repdb.co) no README ou na área de créditos, conforme a [licença Free Tier](https://github.com/RepDB/exercise-dataset/blob/main/LICENSE-DATA.md). Não redistribuir os arquivos como dataset, usar as prévias premium em produção ou fornecer suas imagens como entrada ou referência para geração por IA.

Fotos genéricas de academia, alimentos ou bancos de imagens não são substitutas de demonstrações do exercício. Se uma busca falhar, retornar nenhuma sugestão; não inventar URLs nem notas de qualidade. Esta política trata de imagens de exercícios, não de capas de protocolos.

## Publicação e rastreabilidade

- Revisar a candidata antes de vinculá-la ao cadastro; a aprovação deste padrão não dispensa a conferência de cada imagem.
- Usar o fluxo administrativo existente e respeitar a autorização dada para o trabalho em andamento.
- Hospedar em armazenamento durável de mídia do projeto e verificar resposta HTTP 200 com conteúdo de imagem.
- Atualizar `exercises.image_url` pelo ID do exercício, evitando associações por nomes aproximados.
- Preservar a URL anterior em `exercises.version_history`, junto à nova URL, data, origem e motivo da alteração.
- Manter os IDs e os vínculos com os treinos existentes.
- Não reativar o script legado `db_exercises_images_update.sql` nem o fallback de fotos genéricas de `aiMediaFinder`.

A geração de imagens nesta etapa é uma atividade editorial. Este padrão não exige adicionar funcionalidades de IA ao aplicativo nem alterar o design do player de execução.
