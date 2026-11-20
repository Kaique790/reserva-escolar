import AuthButton from "@/app/components/auth-button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-900">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
          Reserva Escolar
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Recursos da sua escola, em um só lugar.
        </h1>
        <p className="mt-4 text-slate-600">
          Entre com sua conta Google para continuar.
        </p>
        <div className="mt-8">
          <AuthButton />
        </div>
      </section>
    </main>
  );
}
