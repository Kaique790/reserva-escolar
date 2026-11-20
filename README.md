# Reserva Escolar

Aplicação Next.js para reserva de recursos escolares, com autenticação Google via NextAuth e persistência de contas/sessões no MySQL.

## Configuração da autenticação

1. Use `.env.example` como referência para adicionar as variáveis ao `.env` local existente (preserve o `DATABASE_URL` já configurado). Se ainda não houver `.env`, copie o template. Gere um segredo exclusivo para `NEXTAUTH_SECRET` com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Nunca compartilhe ou versione o arquivo `.env`.
2. No Google Cloud Console, crie um cliente OAuth do tipo **Aplicativo da Web** e configure:
   - URI de redirecionamento autorizado local: `http://localhost:3000/api/auth/callback/google`
   - URI de redirecionamento autorizado de produção: `https://SEU_DOMINIO/api/auth/callback/google`
3. Aplique a migration do banco com `npx prisma migrate deploy`.
4. Inicie o projeto com `npm run dev`.

As credenciais e o segredo são usados somente no servidor. A aplicação solicita apenas os dados básicos de perfil/e-mail; tokens OAuth não são persistidos nas contas.

## API de escolas

Todas as operações exigem sessão autenticada. O usuário que cria uma escola recebe o papel de administrador global e também de administrador da escola.

- `POST /api/schools` cria uma escola. JSON: `{"name":"Escola Exemplo"}`.
- `PATCH /api/schools` altera o nome e gera um novo slug. JSON: `{"schoolId":"<id>","name":"Novo nome"}`.
- `DELETE /api/schools` exclui permanentemente a escola e seus dados relacionados em cascata. JSON: `{"schoolId":"<id>"}`.

Edição e exclusão exigem que o usuário seja administrador ativo da escola. Nomes repetidos retornam `409 Conflict`; uma sessão ausente retorna `401 Unauthorized`.

## Desenvolvimento

```bash
npm run dev
```
