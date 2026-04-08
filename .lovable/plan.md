

# Plano: Cadastur, WhatsApp, Admin e Footer

## 1. Redesign da seção Cadastur

Redesenhar `src/components/Cadastur.tsx` seguindo o estilo das imagens de referência:
- Layout em duas colunas: certificado (imagem editavel via admin) a esquerda + informacoes a direita
- Titulo "Credenciais e Seguranca"
- Numero do Cadastur, descricao, validade e link de verificacao
- Dados virao da tabela `site_content` (section_key: `cadastur`) para ser editavel no admin
- Dados default hardcoded enquanto admin nao preencher

## 2. Cadastur no Footer

Adicionar no `src/components/Footer.tsx`:
- Linha com icone ShieldCheck + "Agencia regularizada pelo Ministerio do Turismo - Cadastur N..."
- Link "Acesso Admin" apontando para `/admin/login`

## 3. Newsletter no Footer

Adicionar secao "Receba nossas novidades" acima do footer (como na imagem de referencia):
- Campo de email + botao "Assinar"
- Salvar emails em nova tabela `newsletter_subscribers`

## 4. Admin: Gerenciar Cadastur

Adicionar nova tab "Cadastur" no `AdminDashboard.tsx`:
- Formulario para editar: numero cadastur, validade, descricao, link verificacao
- Upload da imagem do certificado
- Salvar em `site_content` com key `cadastur`

## 5. Admin: Alterar Senha

Adicionar nova tab "Configuracoes" no admin com opcao de alterar senha usando `supabase.auth.updateUser({ password })`.

## 6. WhatsApp Float

Substituir o icone `MessageCircle` do Lucide por um SVG real do logo do WhatsApp em `WhatsAppFloat.tsx`.

## 7. Criar conta admin

- Criar o usuario via signup com email `slturismocg@gmail.com` usando edge function ou migration
- Auto-confirm ja esta habilitado
- Atribuir role admin via insert na tabela `user_roles`

Vou precisar perguntar a senha desejada para criar a conta, ou posso usar o fluxo de signup existente + migration para atribuir o role apos o cadastro.

## 8. Database

- Nova tabela `newsletter_subscribers` (id, email, created_at) com RLS: insert publico, select admin
- Insert na `site_content` com dados default do Cadastur

---

## Arquivos a modificar/criar

| Arquivo | Alteracao |
|---|---|
| `Cadastur.tsx` | Redesign completo com dados do banco |
| `Footer.tsx` | Cadastur info + link admin + newsletter |
| `WhatsAppFloat.tsx` | SVG real do WhatsApp |
| `AdminDashboard.tsx` | Tabs Cadastur + Configuracoes |
| `admin/AdminCadastur.tsx` | Novo - CRUD cadastur |
| `admin/AdminSettings.tsx` | Novo - alterar senha |
| Migration SQL | Tabela newsletter, insert site_content default, criar admin user |

