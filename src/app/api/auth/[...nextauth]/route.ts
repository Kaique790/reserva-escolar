import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { createAuthOptions } from "@/lib/auth";

let handler: ReturnType<typeof NextAuth> | undefined;

function getHandler() {
  if (!handler) {
    handler = NextAuth(createAuthOptions());
  }

  return handler;
}

type RouteContext = { params: Promise<{ nextauth: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return getHandler()(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return getHandler()(request, context);
}