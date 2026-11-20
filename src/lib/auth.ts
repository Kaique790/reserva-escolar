import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { AdapterAccount } from "next-auth/adapters";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getPrismaClient } from "@/lib/prisma";

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createAuthOptions(): NextAuthOptions {
  const prisma = getPrismaClient();
  const prismaAdapter = PrismaAdapter(prisma);
  const linkAccount = prismaAdapter.linkAccount;

  if (!linkAccount) {
    throw new Error("The Prisma adapter does not support linking accounts.");
  }

  return {
    adapter: {
      ...prismaAdapter,
      async linkAccount(account: AdapterAccount) {
        const accountWithoutTokens = { ...account };
        delete accountWithoutTokens.access_token;
        delete accountWithoutTokens.refresh_token;
        delete accountWithoutTokens.id_token;

        return linkAccount(accountWithoutTokens);
      },
    },
    secret: requiredEnvironmentVariable("NEXTAUTH_SECRET"),
    session: { strategy: "database" },
    providers: [
      GoogleProvider({
        clientId: requiredEnvironmentVariable("GOOGLE_CLIENT_ID"),
        clientSecret: requiredEnvironmentVariable("GOOGLE_CLIENT_SECRET"),
        profile(profile) {
          if (
            profile.email_verified !== true ||
            !profile.email ||
            !profile.name
          ) {
            throw new Error("Google must provide a verified email and name.");
          }

          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
          };
        },
      }),
    ],
    callbacks: {
      async signIn({ account, user }) {
        if (account?.provider !== "google" || !user.email) {
          return false;
        }

        const existingUser = await getPrismaClient().user.findUnique({
          where: { email: user.email },
          select: { isActive: true },
        });

        return existingUser?.isActive !== false;
      },
    },
  };
}
