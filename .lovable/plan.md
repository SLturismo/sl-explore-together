

# Plano: Ajustes no Site SL Turismo

## 1. Centralizar menu de navegação no Header

Atualmente o menu desktop fica alinhado à direita. Vou centralizar os links de navegação entre o logo (esquerda) e o botão de contato (direita), usando `justify-between` com 3 blocos: logo | nav centralizado | botão contato.

**Arquivo:** `src/components/Header.tsx`

## 2. Renomear seção "Planeje sua Viagem" para incluir Eventos

Atualizar o título da seção e o formulário para refletir que a agência também organiza eventos:
- Título: "Planeje sua **Viagem ou Evento**"
- Subtítulo atualizado mencionando viagens e eventos
- Adicionar opção "Organização de Evento" no select de tipo
- Atualizar o label do nav de "Planeje sua Viagem" para "Viagens & Eventos"
- Atualizar o placeholder do campo destino para incluir "ou tipo de evento"

**Arquivos:** `src/components/TravelForm.tsx`, `src/components/Header.tsx`

## 3. Criar usuário admin no backend

Vou criar uma migration SQL que:
- Cria um usuário admin na tabela `auth.users` via função `create_user`
- Atribui o papel `admin` na tabela `user_roles`
- O email e senha serão fornecidos ao usuário para acesso em `/admin/login`

**Método:** Usar uma edge function ou migration para inserir o admin. Como não posso modificar `auth.users` diretamente via migration, vou habilitar auto-confirm temporariamente, criar o usuário via signup no código, e depois atribuir a role. Alternativa mais simples: pedir ao usuário que se cadastre e depois atribuir a role via migration.

**Abordagem escolhida:** Vou adicionar uma tela de signup na página de admin login (apenas para o primeiro acesso), e criar uma migration que atribui a role admin ao primeiro usuário que se registrar com um email específico. Ou melhor — vou simplesmente usar uma migration SQL com `auth.users` insert via `supabase_admin` para criar o admin diretamente.

Na verdade, a forma mais segura: criar o admin via edge function que usa o service role key. Vou criar uma migration que insere a role admin para um user_id específico, e pedir ao usuário para primeiro se registrar em `/admin/login` (adicionando um botão de registro), e depois rodar a migration.

**Plano final para admin:**
1. Adicionar botão "Criar conta" na tela de login admin (signup com email/senha)
2. Após o signup, o usuário precisa confirmar email — vou habilitar auto-confirm para simplificar
3. Criar migration que atribui role admin ao usuário pelo email

## 4. Verificação geral

- Confirmar que o formulário de viagem insere dados no banco
- Confirmar que a galeria, eventos e demais seções renderizam corretamente
- Confirmar que o login admin funciona e redireciona para o dashboard

---

## Resumo das alterações

| Arquivo | Alteração |
|---|---|
| `Header.tsx` | Centralizar nav, renomear link |
| `TravelForm.tsx` | Título + opção de evento no select |
| `AdminLogin.tsx` | Adicionar opção de signup |
| Migration SQL | Atribuir role admin |
| Auth config | Habilitar auto-confirm |

