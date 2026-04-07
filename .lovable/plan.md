

# Plano: Site Completo SL Turismo

## Visão Geral

Site moderno e responsivo para a agência SL Turismo, voltado para mulheres, com identidade visual baseada nas cores do logo (rosa, dourado, verde, amarelo), frontend completo + backend com Supabase (Lovable Cloud) para área administrativa.

---

## Estrutura do Site

O site será uma **página única (single page)** com navegação por scroll suave entre seções, mais rotas separadas para Login Admin e Painel Admin.

```text
Rotas:
/              → Landing page (todas as seções)
/admin/login   → Login do administrador
/admin         → Painel administrativo
```

### Seções da Landing Page:
1. **Header** — Logo, menu de navegação, WhatsApp
2. **Hero** — Frase inspiradora + CTA "Planejar minha viagem"
3. **Galeria** — Fotos por categorias (praias, internacional, solo)
4. **Formulário** — Solicitação de viagem personalizada
5. **Eventos** — Viagens em grupo e tours exclusivos
6. **Sobre** — História e propósito da agência
7. **Cadastur** — Selo de credibilidade
8. **Footer** — Contatos, redes sociais
9. **WhatsApp Float** — Botão fixo no canto inferior direito

---

## Design System

Paleta extraída do logo:
- **Rosa/Magenta** (#E91E8C) — cor primária
- **Dourado** (#D4A843) — destaques e acentos
- **Verde Turquesa** (#2BBAB4) — detalhes secundários
- **Amarelo** (#F5C518) — sol/energia
- **Rosa claro** (#FFF0F5) — fundo suave
- **Branco** — background principal

Fonte: Inter (corpo) + Playfair Display (títulos elegantes)

---

## Backend (Lovable Cloud / Supabase)

### Tabelas:
- **gallery_images** — id, url, category, description, order, created_at
- **events** — id, title, description, image_url, date, location, active, created_at
- **travel_requests** — id, name, email, phone, destination, dates, budget, trip_type, notes, status, created_at
- **site_content** — id, section_key, content (JSON), updated_at
- **user_roles** — id, user_id, role (enum: admin)

### Storage:
- Bucket `gallery` (público) para fotos da galeria
- Bucket `events` (público) para imagens de eventos

### RLS:
- gallery_images, events, site_content: leitura pública, escrita apenas admin
- travel_requests: inserção pública, leitura apenas admin

---

## Área Administrativa

Painel protegido por autenticação com funcionalidades:
- Gerenciar galeria (upload, remover, reordenar)
- Gerenciar eventos (CRUD)
- Ver e responder solicitações de viagem
- Editar textos das seções do site

---

## Imagens

Serão geradas 5-6 imagens com IA para hero banner e galeria como placeholders iniciais.

---

## Componentes a Criar

| Componente | Descrição |
|---|---|
| `Header` | Logo + nav + contato |
| `Hero` | Banner com frase e CTA |
| `Gallery` | Grid filtrado por categoria |
| `TravelForm` | Formulário com validação (Zod) |
| `Events` | Cards de eventos |
| `About` | História da agência |
| `Cadastur` | Selo de credibilidade |
| `Footer` | Links e contato |
| `WhatsAppFloat` | Botão flutuante (67) 99953-5548 |
| `AdminLogin` | Tela de login |
| `AdminDashboard` | Painel com tabs/sidebar |
| `AdminGallery` | CRUD galeria |
| `AdminEvents` | CRUD eventos |
| `AdminRequests` | Lista de solicitações |
| `AdminContent` | Editor de textos |
| `ProtectedRoute` | Guard de autenticação |

---

## Detalhes Técnicos

- Scroll suave com `react-scroll` ou IDs nativos
- Formulário validado com Zod
- WhatsApp link: `https://wa.me/5567999535548`
- Imagens otimizadas via src/assets imports
- Responsivo: mobile-first (384px viewport atual)
- Supabase Auth para login admin
- Edge function para notificações de novas solicitações (opcional)

