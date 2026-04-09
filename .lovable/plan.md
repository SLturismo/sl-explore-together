

# Plano: Melhorias visuais, ADM completo e fluxo de atendimento

## 1. Correções visuais no Footer

**Newsletter:** Trocar `bg-primary` (rosa) por `bg-foreground` (tom escuro do rodapé) na seção "Receba nossas novidades", mantendo harmonia com o restante do footer.

**Cadastur:** Centralizar a linha "Agência regularizada pelo Ministério do Turismo — Cadastur" usando `justify-center` e `text-center`.

**Arquivo:** `src/components/Footer.tsx`

## 2. Fluxo de atendimento melhorado (AdminRequests)

Expandir os status de atendimento e adicionar mais controle:

- **Novos status:** `pending` (Nova), `seen` (Visualizada), `in_progress` (Em andamento), `contacted` (Contatada), `confirmed` (Confirmada), `cancelled` (Cancelada)
- **Indicador visual:** Badge colorido para cada status
- **Filtro por status:** Select no topo para filtrar solicitações
- **Contadores:** Mostrar quantidade por status (ex: "3 Novas · 2 Em andamento")
- **Confirmação de recebimento:** Ao abrir uma solicitação "Nova", automaticamente marca como "Visualizada"

**Arquivo:** `src/components/admin/AdminRequests.tsx`

## 3. Galeria editável no ADM

Adicionar botão de **editar** em cada imagem da galeria (além do deletar):
- Modal/formulário inline para alterar título, descrição, categoria e substituir a imagem
- Reordenar (drag ou botões cima/baixo)

**Arquivo:** `src/components/admin/AdminGallery.tsx`

## 4. Eventos editáveis no ADM

Adicionar botão de **editar** em cada evento:
- Modal/formulário para alterar título, descrição, data, local, vagas e imagem

**Arquivo:** `src/components/admin/AdminEvents.tsx`

## 5. Newsletter/Emails no ADM

Adicionar nova tab **"Newsletter"** no painel admin:
- Lista de todos os emails inscritos com data de inscrição
- Opção de excluir inscritos
- Contador total de inscritos

**Arquivos:** `src/pages/AdminDashboard.tsx`, novo `src/components/admin/AdminNewsletter.tsx`

## 6. Edição de conteúdo do site (Hero, Sobre)

Expandir a tab **Configurações** ou criar tab **"Conteúdo"** para editar:
- Textos do Hero (título, subtítulo)
- Textos do Sobre (descrição da agência)
- Salvar em `site_content` com keys `hero` e `about`

**Arquivos:** `src/components/admin/AdminSettings.tsx` ou novo `src/components/admin/AdminContent.tsx`, atualizar `Hero.tsx` e `About.tsx` para buscar dados dinâmicos

---

## Resumo das alterações

| Arquivo | Alteração |
|---|---|
| `Footer.tsx` | Cor newsletter + centralizar Cadastur |
| `AdminRequests.tsx` | Novos status, filtros, contadores |
| `AdminGallery.tsx` | Edição de imagens existentes |
| `AdminEvents.tsx` | Edição de eventos existentes |
| `AdminDashboard.tsx` | Nova tab Newsletter |
| `AdminNewsletter.tsx` | Novo - lista de inscritos |
| `AdminContent.tsx` | Novo - editar textos do site |
| `Hero.tsx` / `About.tsx` | Buscar conteúdo dinâmico do banco |

