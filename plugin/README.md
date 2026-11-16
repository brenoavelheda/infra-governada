# governanca — plugin de infraestrutura governada para Claude Code

O modelo pensa livremente. O que ele pode fazer é decidido por gates em código, fora do modelo.
Num workspace ativado, o Claude entra num ciclo fixo: **SPEC → ondas → NOTES.md → /compact → recuperação**.

O plugin fica instalado uma vez e vale em qualquer workspace, mas só age onde existe `.claude/governanca.json`. Nos demais, todos os hooks saem sem fazer nada.

## Instalar
Requisitos: Claude Code e Node.js no PATH (`node --version`).

No Claude Code:
```
/plugin marketplace add brenoavelheda/infra-governada
/plugin install governanca@infra-governada
```
Ou no terminal:
```
claude plugin marketplace add brenoavelheda/infra-governada
claude plugin install governanca@infra-governada
```
Em uma linha (Claude Code 2.1.275+): `/plugin install governanca --marketplace brenoavelheda/infra-governada`.
De uma cópia local: `/plugin marketplace add <pasta-do-repositório>`.

## Ativar num workspace
Abra o Claude na pasta do projeto e rode `/governanca:iniciar`. Ele cria:

| Arquivo | Papel | Git |
|---|---|---|
| `.claude/governanca.json` | Liga a governança e guarda as regras do projeto | versionar |
| `SPEC.md` | O quê: objetivo, critérios, ondas | versionar |
| `NOTES.md` | Estado atual e próximo passo | versionar |
| `.governanca/` | Estado dos hooks, auditoria, histórico de regras | fora do git (vai para o `.gitignore`) |

Os gates valem na hora. Protocolo, SPEC e NOTES entram no contexto a partir da próxima sessão (ou após `/clear`).

## Comandos
| Comando | Faz |
|---|---|
| `/governanca:iniciar` | Ativa a governança no workspace |
| `/governanca:spec` | Brainstorm e plano (Superpowers); a SPEC.md resume e aponta |
| `/governanca:onda` | Executa a próxima onda (fase do plano), verifica e registra |
| `/governanca:recovery` | Resume onde o trabalho parou |
| `/governanca:status` | Config, regras, pendências e últimos bloqueios |
| `/governanca:regra <texto>` | O agente transforma uma regra em proposta de gate |
| `/governanca:aplicar` | Você revisa a proposta; `/governanca:aplicar confirmar <código>` aplica |

## Como funciona
| Hook | Quando | Faz |
|---|---|---|
| SessionStart | Abrir, retomar, `/clear`, após `/compact` | Injeta protocolo, regras, SPEC, próxima tarefa do plano e NOTES |
| PreToolUse | Antes de Bash, PowerShell, Read, Edit, Write, Grep, Glob, Skill | Gates: bloqueia (`deny`) ou pede confirmação (`ask`) |
| PostToolUse | Depois de Bash, PowerShell, Edit, Write, MCP | Auditoria em `.governanca/auditoria.jsonl`; marca pendências |
| Stop | Ao encerrar o turno | Com arquivos alterados: roda a verificação do projeto e exige NOTES.md atualizado |

Os gates valem também em modo bypass (`--dangerously-skip-permissions`): um `deny` de hook bloqueia de qualquer forma.

## Gates embutidos
| Gate | Decisão | Efeito |
|---|---|---|
| segredo | deny | Ler ou alterar `.env`, `.pem`, `id_rsa`, `credentials.json` (`.env.example` liberado) |
| envelope | deny | Alterar `.claude/governanca.json`, settings, hooks, plugins, `.governanca/`, `.mcp.json`, settings global |
| privilegio | deny | `sudo` |
| destrutivo | deny | `rm -rf` na raiz ou na home |
| force-push | deny | `git push --force` |
| exec-remoto | deny | `curl ... \| sh` e equivalentes no PowerShell |
| push, deploy, descarte, banco | ask | `git push`, `firebase deploy`, `npm publish`, `git reset --hard`, `DROP TABLE` |
| config | deny | `governanca.json` inválido: bloqueia escrita e shell até ser corrigido |
| notes | parada | Encerrar com arquivos alterados sem atualizar NOTES.md |
| verificacao | parada | Encerrar com a verificação do projeto falhando |
| erro | deny | Falha interna do gate bloqueia; nunca libera em silêncio |

Na parada, depois de 3 bloqueios seguidos o plugin libera e mostra as pendências ao usuário, para não entrar em laço.

## Regras do projeto
`.claude/governanca.json`:
```json
{
  "versao": 1,
  "exigirSpec": true,
  "verificacao": { "comando": "npm test", "timeoutSeg": 120 },
  "regras": [
    {
      "id": "aprovado",
      "decisao": "deny",
      "motivo": "Só o usuário marca aprovado.",
      "saida": "deixe aprovado false e avise o usuário.",
      "caminho": "dados/contratos/*.json",
      "conteudo": "\"aprovado\"\\s*:\\s*true",
      "comando": "aprovado[\"']?\\s*:\\s*true"
    }
  ]
}
```

| Campo | Obrigatório | Significado |
|---|---|---|
| `exigirSpec` | não (padrão `true`) | Sem SPEC preenchida, o agente conduz `/governanca:spec` antes de implementar |
| `verificacao.comando` | não | Comando que precisa passar (código 0) para encerrar quando houve edição; vazio = desligado |
| `verificacao.timeoutSeg` | não (padrão 120, máx. 280) | Tempo limite da verificação |
| `regras[].id` | sim | Nome curto, aparece como `[GATE:<id>]` |
| `regras[].decisao` | sim | `deny` (bloqueia) ou `ask` (pede confirmação) |
| `regras[].caminho` | um dos três | Glob sobre o caminho relativo (`*`, `**`, `?`) |
| `regras[].conteudo` | um dos três | Regex sobre o texto que está sendo escrito (Write, Edit, MultiEdit, NotebookEdit) |
| `regras[].comando` | um dos três | Regex sobre o comando de Bash ou PowerShell |
| `regras[].ferramentas` | não | Lista de ferramentas; padrão: de escrita (se houver `caminho`/`conteudo`) e shell (se houver `comando`). Use `["Read"]` para bloquear leitura |
| `regras[].motivo`, `saida` | não | Texto mostrado ao agente: por que bloqueou e como prosseguir |

Uma regra tem dois canais. **Arquivo**: casa quando `caminho` e `conteudo` (os que existirem) casam. **Shell**: casa quando `comando` casa. Regex e glob não distinguem maiúsculas. Entre todas as regras, `deny` vence `ask`.

### Mudar as regras
O agente não edita `governanca.json` (é o envelope). O caminho é:
1. `/governanca:regra o agente nunca roda firebase deploy` — o agente escreve `governanca-proposta.json` e mostra a diferença.
2. `/governanca:aplicar` — você vê a diferença e um código de 8 caracteres.
3. `/governanca:aplicar confirmar <código>` — aplica exatamente o que foi mostrado e guarda a versão anterior em `.governanca/historico/`.

O agente não consegue confirmar: o comando não é invocável pelo modelo e o gate bloqueia a confirmação via shell. Editar o arquivo à mão também funciona.

## Limites
- Gates de shell comparam padrões no texto do comando. Um script que o agente escreva e depois execute pode escapar deles. A barreira para isso é o sandbox do sistema (`/sandbox`: Linux, macOS ou WSL2).
- Edições feitas via shell (por exemplo, `sed -i`) não marcam pendência de NOTES nem de verificação; só as ferramentas de edição marcam.
- Sem `node` no PATH, os hooks falham sem bloquear.
- Em workspace não ativado, cada chamada de ferramenta inicia um processo `node` que sai logo (cerca de 0,1 s).
- `ask` pede confirmação a quem está no terminal. Sem terminal (`claude -p`), o comando não roda.

## Migrar do kit antigo (`instalar.js`)
O `/governanca:iniciar` recusa workspaces com o kit antigo. O gate antigo impede o próprio agente de removê-lo naquele workspace; faça à mão ou de outra sessão:
1. Apague `.claude/hooks/{gate,lib,parada,registro,sessao}.js`, `.claude/commands/{spec,onda,recovery}.md` e `.claude/governanca.md`.
2. Em `.claude/settings.json`, remova o bloco `hooks` (as `permissions` podem ficar).
3. No `CLAUDE.md`, remova a linha `@.claude/governanca.md`.
4. Rode `/governanca:iniciar`. SPEC.md e NOTES.md existentes são mantidos.

## Desativar
- Num workspace: apague `.claude/governanca.json` (à mão; o agente é bloqueado).
- Em tudo: `/plugin uninstall governanca@infra-governada`.

## Testes
```
node --test plugin/tests
```
