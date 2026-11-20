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

## Desenvolvimento

```bash
npm run dev
```
