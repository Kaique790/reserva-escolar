"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-wait rounded-lg bg-slate-200 px-5 py-3 font-semibold text-slate-600 sm:w-auto"
      >
        Verificando sessão...
      </button>
    );
  }

  if (session?.user) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          Conectado como{" "}
          <span className="font-semibold">
            {session.user.name ?? session.user.email}
          </span>
        </p>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/" })}
          className="w-full rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50 sm:w-auto"
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void signIn("google", { callbackUrl: "/" })}
      className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:w-auto"
    >
      Entrar com Google
    </button>
  );
}
