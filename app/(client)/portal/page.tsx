import { getSessionUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Portal do Cliente",
};

export default async function ClientPortalPage() {
  const user = await getSessionUser();

  if (!user || user.role !== "cliente") {
    redirect("/login");
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold tracking-tight">Portal do Cliente</h1>
      <p className="mt-4 text-muted-foreground">
        Bem-vindo, <strong>{user.nome}</strong>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Cliente ID: <strong>{user.clientId}</strong>
      </p>

      {/* Placeholder para Features 05-06 */}
      <div className="mt-8 rounded-lg border border-border bg-brand-50 p-6">
        <p className="text-sm text-muted-foreground">
          KPI cards do seu cliente e lista de processos chegam na Feature 06
          (Client Portal).
        </p>
      </div>
    </div>
  );
}
