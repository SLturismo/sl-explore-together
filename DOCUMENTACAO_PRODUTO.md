# Documentação do produto — SL Turismo (sl-explore-together)

## 1. Visão geral

A aplicação é um **site institucional e canal de captação** da **SL Turismo**, voltado a **viagens e experiências com foco em mulheres**: liberdade, segurança e roteiros exclusivos. O repositório no GitHub é `sl-explore-together`; a identidade visual e o texto padrão reforçam o posicionamento da marca (Campo Grande–MS, contato via WhatsApp).

O produto combina:

- **Página pública** (landing page em uma única rota) com navegação por âncoras (`#inicio`, `#galeria`, etc.).
- **Painel administrativo** protegido, onde usuários com papel `admin` gerenciam conteúdo, mídia, solicitações e inscritos.

---

## 2. Problema que o produto resolve

- **Para a visitante:** encontrar informações sobre a agência, inspirar-se com a galeria, **solicitar orçamento/planejamento de viagem ou evento** e **assinar newsletter**, com atalhos claros para WhatsApp.
- **Para a operação:** centralizar **pedidos de viagem** (`travel_requests`), **e-mails da newsletter**, edição de **textos do site** e gestão de **eventos** e **imagens** no banco, sem depender de alteração de código para cada mudança de copy (em várias seções).

---

## 3. Público-alvo

- **Visitantes:** mulheres (e demais perfis alinhados ao discurso do site) interessadas em viagens solo, grupo, casal, família, lua de mel ou organização de eventos.
- **Administradores:** equipe SL Turismo com conta no Supabase e registro na tabela `user_roles` com role `admin`.

---

## 4. Funcionalidades principais

### 4.1 Site público (`/`)

| Área | Descrição |
|------|-----------|
| **Header** | Logo, menu (rótulos podem vir do banco em `site_content` / `header`), botão de contato para WhatsApp (`wa.me/5567999535548`). |
| **Hero** | Título, destaque, subtítulo e texto do botão configuráveis via `site_content` (`hero`); imagem de fundo fixa no código. |
| **Galeria** | Títulos/subtítulo editáveis via `site_content` (`gallery`); **grid de imagens é estático no código** (categorias e fotos locais). |
| **Formulário de viagem** | Coleta nome, e-mail, telefone, destino, datas, orçamento, tipo de viagem e observações; grava em `travel_requests` com status `pending`. Textos da seção podem vir de `site_content` (`travel_form`). |
| **Eventos** | **Cartões de eventos são estáticos** no componente (exemplos como Bali, Toscana, Caribe); CTA abre WhatsApp com mensagem pré-preenchida. **Não consome a tabela `events` do Supabase na vitrine.** |
| **Sobre** | Textos e diferenciais editáveis via `site_content` (`about`). |
| **Cadastur** | Bloco de credenciais: descrição, número, validade, link de verificação e URL da imagem do certificado via `site_content` (`cadastur`). |
| **Rodapé + Newsletter** | Dados de contato e textos via `site_content` (`footer`, `newsletter`); formulário insere e-mail em `newsletter_subscribers` (único por e-mail). |
| **WhatsApp flutuante** | Botão fixo com mensagem padrão para contato. |

### 4.2 Painel admin (`/admin/login`, `/admin`)

- **Login / cadastro** com Supabase Auth (`signInWithPassword`, `signUp`). A tela permite alternar entre login e “criar conta”; o acesso efetivo ao painel exige papel `admin`.
- **Autorização:** após login, o dashboard consulta `user_roles` filtrando `role = 'admin'`. Sem papel, o usuário é deslogado e recebe mensagem de acesso negado.
- **Módulos laterais:** Solicitações (travel requests), Galeria (imagens no storage + metadados), Eventos (CRUD na tabela `events`), Conteúdo (JSON por `section_key` em `site_content`), Newsletter (lista de inscritos), Cadastur (dados + upload no bucket `cadastur`), Configurações.

---

## 5. Arquitetura técnica

### 5.1 Stack

| Camada | Tecnologia |
|--------|------------|
| Build / dev | Vite 5, TypeScript |
| UI | React 18, Tailwind CSS, shadcn/ui (Radix), Lucide, `next-themes` |
| Roteamento | React Router v6 |
| Dados / cache | TanStack React Query (provider global; uso pontual no app) |
| Backend | **Supabase** (Postgres, Auth, Row Level Security, Storage) |
| Formulários / validação | react-hook-form, Zod, @hookform/resolvers |
| Testes | Vitest, Testing Library; Playwright presente no projeto |

### 5.2 Rotas

- `/` — página inicial composta por seções.
- `/admin/login` — autenticação.
- `/admin` — dashboard (protegido por sessão + `user_roles`).
- `*` — página não encontrada.

### 5.3 Variáveis de ambiente

O cliente Supabase usa:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Definidas em `.env` (não versionar segredos em repositório público).

---

## 6. Modelo de dados (Supabase)

Principais tabelas públicas (schema `public`):

- **`travel_requests`** — solicitações do formulário; insert liberado a qualquer um; leitura/alteração/exclusão apenas para `admin`.
- **`gallery_images`** — metadados da galeria administrada; leitura pública; escrita apenas admin.
- **`events`** — eventos geridos no painel; leitura pública nas políticas, porém **a home não lista esses registros hoje**.
- **`site_content`** — documentos JSON por `section_key` (ex.: `hero`, `header`, `about`, `footer`, `newsletter`, `cadastur`); leitura pública; escrita admin.
- **`newsletter_subscribers`** — e-mails inscritos; insert público; leitura/delete admin.
- **`user_roles`** — vínculo usuário ↔ `app_role` (`admin`); função SQL `has_role` para políticas RLS.

**Storage:** buckets `gallery`, `events`, `cadastur` (imagens públicas na leitura; upload restrito a admin nas políticas definidas nas migrations).

---

## 7. Segurança e governança

- **RLS** habilitado nas tabelas sensíveis; operações administrativas condicionadas a `has_role(..., 'admin')`.
- **Cadastro aberto** em `/admin/login` cria usuários no Auth, mas **não concede automaticamente** papel `admin` — é necessário inserir o registro em `user_roles` (processo manual ou script no Supabase).
- Chave **publishable** do Supabase é adequada ao front; operações privilegiadas devem permanecer no servidor/Edge Functions se evoluírem regras de negócio mais críticas.

---

## 8. Como executar localmente

```bash
npm install
# Configurar .env com VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Build de produção: `npm run build` · Preview: `npm run preview` · Lint: `npm run lint` · Testes: `npm run test`.

---

## 9. Lacunas e oportunidades de evolução (com base no código)

1. **Eventos:** o admin persiste eventos no banco, mas a seção pública **Events** usa array fixo no front. Evolução natural: buscar `events` com `active = true` e exibir imagens a partir de `image_url`.
2. **Galeria:** o admin gerencia `gallery_images` e storage `gallery`; a seção pública ainda usa **imagens estáticas**. Evolução: consumir `gallery_images` ordenado por `display_order`.
3. **WhatsApp e telefone:** vários links usam número fixo no código; pode alinhar com `site_content` / **AdminSettings** para um único ponto de configuração.
4. **README:** o arquivo do projeto ainda é o placeholder do Lovable; pode ser substituído por instruções de deploy, variáveis de ambiente e provisionamento Supabase.

---

## 10. Resumo executivo

**SL Turismo (sl-explore-together)** é uma **SPA React** com **landing de alta conversão** (formulário, newsletter, WhatsApp) e **back-office integrado ao Supabase** para conteúdo dinâmico e operação de leads. O núcleo do produto está maduro em **autenticação por papéis**, **RLS** e **gestão de solicitações e newsletter**; a **sincronização completa entre painel e vitrine** para galeria e eventos é o principal ganho incremental identificado no código atual.

---

*Documento gerado a partir da análise do repositório em abril de 2026.*
