

# Plano: Restaurar cor rosa da newsletter + Redesign profissional do Admin

## 1. Restaurar cor rosa na seção Newsletter

Trocar `bg-foreground` de volta para `bg-primary` na seção "Receba nossas novidades" no Footer, como estava antes na imagem de referencia.

**Arquivo:** `src/components/Footer.tsx` (linha 35)

## 2. Redesign completo do Painel Admin

O painel atual usa tabs simples em uma linha, cards basicos e formularios inline sem hierarquia visual. Vou redesenhar seguindo padroes de dashboards profissionais (inspirado em paineis como Vercel, Stripe Dashboard, WordPress Admin):

### Layout principal
- **Sidebar fixa** a esquerda com icones + labels, logo no topo, botao sair no rodape
- **Area de conteudo** a direita com header contextual (titulo da secao atual + breadcrumb)
- **Cards com metricas** no topo de cada secao (total de solicitacoes, imagens, eventos, inscritos)

### Melhorias por secao

**Solicitacoes:**
- Tabela profissional com colunas (Nome, Destino, Data, Status, Acoes) em vez de cards empilhados
- Modal lateral (sheet/drawer) para detalhes ao clicar em uma solicitacao
- Botoes de acao claros (WhatsApp, alterar status) no modal

**Galeria:**
- Grid visual com preview maior das imagens (aspect-ratio 4:3)
- Modal de edicao ao clicar no icone de editar (em vez de inline)
- Drag area melhorada para upload com preview antes de enviar
- Selecao de categoria via select em vez de input livre

**Eventos:**
- Cards visuais com imagem, titulo e badges (ativo/inativo, vagas)
- Modal para criar/editar eventos com formulario organizado
- Upload de imagem integrado no formulario de criacao

**Conteudo (Hero/Sobre):**
- Preview ao vivo do texto ao lado do formulario de edicao
- Separacao visual clara entre secoes

**Newsletter:**
- Tabela com paginacao para lista de inscritos
- Botao exportar CSV
- Busca por email

**Cadastur:**
- Layout em 2 colunas: formulario a esquerda, preview do certificado a direita

**Configuracoes:**
- Layout mais limpo com secoes separadas (Senha, Perfil futuro)

### Design system do admin
- Fundo: `bg-gray-50` (neutro claro)
- Sidebar: `bg-white` com borda e sombra sutil
- Cards: `bg-white` com `shadow-sm` e `rounded-xl`
- Tipografia: hierarquia clara com `text-2xl` para titulos de secao
- Botoes primarios com `bg-primary` consistente
- Espacamento generoso (`p-6`, `gap-6`)

## Arquivos a criar/modificar

| Arquivo | Alteracao |
|---|---|
| `Footer.tsx` | Voltar `bg-primary` na newsletter |
| `AdminDashboard.tsx` | Redesign com sidebar + layout profissional |
| `AdminRequests.tsx` | Tabela + modal lateral |
| `AdminGallery.tsx` | Grid melhorado + modal de edicao |
| `AdminEvents.tsx` | Cards visuais + modal criar/editar |
| `AdminContent.tsx` | Preview ao vivo |
| `AdminNewsletter.tsx` | Tabela com busca |
| `AdminCadastur.tsx` | Layout 2 colunas com preview |
| `AdminSettings.tsx` | Layout mais limpo |

