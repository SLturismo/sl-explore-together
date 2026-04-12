

# Plano: Popular banco de dados com dados iniciais

## Diagnóstico

Todas as 6 tabelas já existem (`events`, `gallery_images`, `newsletter_subscribers`, `site_content`, `travel_requests`, `user_roles`). Os 3 buckets de storage estão criados. O admin `slturismocg@gmail.com` está ativo com role `admin`.

**O problema:** as tabelas `site_content`, `gallery_images` e `events` estão vazias — por isso o site não mostra conteúdo.

## O que vou fazer

### 1. Inserir dados padrão em `site_content`

Inserir registros para todas as section_keys que o site consome:
- `header` — labels do menu
- `hero` — título, subtítulo, botão
- `gallery` — título da galeria
- `travel_form` — título e subtítulo do formulário
- `about` — textos da seção Sobre
- `cadastur` — dados do certificado
- `footer` — textos do rodapé
- `newsletter` — título e subtítulo da newsletter

### 2. Inserir imagens padrão na galeria

Inserir registros em `gallery_images` com URLs das imagens default que já estão em `/gallery-defaults/` no projeto público.

### 3. Inserir eventos de exemplo

Inserir 2-3 eventos de exemplo em `events` para que a seção de eventos funcione.

Tudo será feito via insert tool (dados, não schema).

