# Protocolo de trabalho governado

Este workspace usa um ciclo fixo. O estado vive em arquivos (SPEC.md, NOTES.md), não na conversa.

## Ao iniciar
O plugin injeta este protocolo, as regras do projeto, a SPEC, o plano e o NOTES. Retome do "Próximo passo".
Se a SPEC não estiver preenchida, conduza o /governanca:spec antes de implementar qualquer coisa.

## Papéis dos arquivos
Não crie documentos concorrentes.

| Arquivo | Papel | Quem escreve |
|---|---|---|
| SPEC.md | O quê: objetivo, critérios, ondas; aponta Design e Plano | /governanca:spec |
| Design (`docs/superpowers/specs/...`) | Por quê e como, decidido com o usuário | superpowers:brainstorming |
| Plano (`docs/superpowers/plans/...`) | Tarefas passo a passo, com checkboxes | superpowers:writing-plans |
| NOTES.md | Estado atual e próximo passo | toda onda |

Superpowers ausente: siga o ciclo abaixo sem ele.

## Ciclo por onda
1. Explorar: ler o necessário, sem editar.
2. Planejar: plano curto (arquivos, mudança, como verificar). Mudança não trivial: mostrar o plano ao usuário antes.
3. Implementar: só o escopo da onda atual.
4. Verificar: executar o critério "pronto quando" da onda e registrar a saída real.
5. Registrar: atualizar NOTES.md (feito, evidência, decisões, próximo passo).

Uma onda por vez. Ao fim da onda, parar e reportar.

## Condição de parada
Encerrar só quando:
- o critério da onda foi verificado com evidência; ou
- há bloqueio que depende do usuário (registrar em "Bloqueios" no NOTES.md).

Achar que terminou não é critério. Com arquivos alterados, o plugin exige NOTES.md atualizado e, se configurado, a verificação do projeto passando.

## Gates
- Mensagens `[GATE:...]` vêm de regras em código. Não contorne (não tente outro comando para o mesmo efeito). Explique ao usuário o que foi bloqueado e o que ele precisa fazer.
- O agente não altera a governança (`.claude/governanca.json`, settings, hooks, plugins, `.governanca/`). Para mudar uma regra: /governanca:regra gera a proposta; só o usuário aplica, com /governanca:aplicar.
- Arquivos de segredo (.env, chaves) não são lidos. Se precisar de um valor, peça ao usuário só esse valor.
- Regra do projeto que é decidível e ainda não é gate: sugira /governanca:regra.

## Contexto
- Antes de /compact: atualizar NOTES.md.
- Tarefa não relacionada: sugerir /clear (o estado já está no NOTES.md).

## Relato
Reporte falhas com a saída real. Não declare sucesso sem verificação.
