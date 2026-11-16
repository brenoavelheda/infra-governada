---
description: Transforma uma regra do projeto em gate (gera proposta para o usuário revisar e aplicar)
argument-hint: <regra em linguagem natural>
---
Regra pedida: $ARGUMENTS

1. Leia `.claude/governanca.json` e o esquema em `${CLAUDE_PLUGIN_ROOT}/README.md`, seção "Regras do projeto".
2. Decida se a regra é decidível, isto é, testável pelo caminho do arquivo, pelo conteúdo escrito ou pelo texto do comando. Se não for, diga isso, sugira estrutura (modelo, checklist) ou revisão humana, e pare.
3. Escreva `governanca-proposta.json` na raiz do workspace: a configuração atual inteira mais a regra nova (`id` curto, `decisao` "deny" ou "ask", `motivo`, `saida`). Cubra os dois canais quando couber: arquivo (`caminho`/`conteudo`) e shell (`comando`).
4. Rode `node "${CLAUDE_PLUGIN_ROOT}/scripts/aplicar.js"`. Isso só valida e mostra a diferença; não aplica.
5. Mostre ao usuário: a regra, um exemplo que ela bloqueia, um que ela libera e a instrução "revise e digite /governanca:aplicar".

Você não aplica a proposta. Isso é do usuário.
