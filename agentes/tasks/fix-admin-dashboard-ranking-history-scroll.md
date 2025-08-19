---
title: Corrigir layout: ranking estendendo e histórico sem scroll interno (Admin Dashboard)
created: 2025-08-19
priority: medium
labels: [ui, bug, frontend, admin-dashboard]
assignees: []
---

Resumo
------

No Admin Dashboard há dois grupos principais lado a lado: o cartão de "Top 10 Alunos" (ranking, coluna esquerda) e o cartão de "Transações Recentes" (histórico, coluna direita).

Problema: o grupo de ranking está estendendo verticalmente além do que deveria (deveria terminar logo após o 10º aluno). O grupo de histórico (direita) precisa acompanhar visualmente o fim do ranking — ou seja, o componente da direita deve ter altura limitada e scroll interno independente em vez de fazer a página inteira rolar. A captura anexa mostra as linhas de referência (vermelha=ponto final desejado do ranking, azul=padding e laranja=scroll desejado no histórico).

Objetivo
--------

Fazer com que:
- o bloco de ranking pare exatamente ao final do décimo aluno (não crescer indefinidamente);
- o bloco de histórico (direita) tenha a mesma altura do bloco de ranking e possua scroll vertical interno (overflow-y: auto) quando o conteúdo exceder essa altura;
- o layout permaneça responsivo e compatível com designs existentes do dashboard.

Arquivos/Locais prováveis a alterar
----------------------------------

- `components/admin-dashboard.tsx` (estrutura dos cartões/colunas)
- `styles/globals.css` ou utilitários de estilo (se necessário)
- `components/ui/*` se for necessário adicionar variações de container ou helpers

Reprodução
----------

1. Fazer login como admin
2. Abrir o Admin Dashboard
3. Observar que a coluna esquerda (Top 10) se estende além do último item e a coluna direita não acompanha o fim, forçando a página a crescer

Diagnóstico rápido (sugestão)
----------------------------

- O layout atual provavelmente usa um container `flex` com duas colunas. A coluna esquerda não está com limite de altura (max-height) ou com overflow configurado, portanto cresce com conteúdo.
- A coluna direita está assumindo 100% do fluxo da página e não possui `overflow-y: auto` com altura limitada.

Solução proposta (passos concretos)
----------------------------------

1. Ajustar o container pai (que contém as duas colunas) para uma altura controlada. Exemplo: definir o wrapper do dashboard como `min-h-[calc(100vh-<header>)]` ou um `max-h` calculado com `calc()` para considerar header/topbar.

2. Tornar as colunas independentes verticalmente usando um layout flex com `items-start` (para evitar que a coluna esquerda cresça empurrando a direita):
   - pai: `flex gap-4 items-start`
   - coluna esquerda (ranking): manter o conteúdo natural, mas limitar com `max-h-[calc(100vh-<offset>)]` e `overflow-hidden` (ou `overflow-y-auto` se desejar scroll interno para o ranking também). Na maioria dos casos queremos que o ranking mostre apenas 10 itens, então `max-h` pode ser fixado para caber 10 linhas + padding.
   - coluna direita (histórico): `flex-1 overflow-y-auto` e `max-h` igual ao da coluna esquerda (ou `height: inherit` se o pai tiver altura explícita).

3. Implementar pequenas utilitários CSS/Tailwind:
   - `max-h-[calc(100vh-12rem)]` (ajustar 12rem de acordo com header/padding)
   - aplicar `overflow-y-auto` na coluna direita
