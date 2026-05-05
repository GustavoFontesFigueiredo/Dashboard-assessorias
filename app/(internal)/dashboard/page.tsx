import { getSessionUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard Interno",
};

export default async function InternalDashboardPage() {
  const user = await getSessionUser();

  if (!user || !["admin", "controller", "advogado"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Interno</h1>
      <p className="mt-4 text-muted-foreground">
        Bem-vindo, <strong>{user.nome}</strong> ({user.role})
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Eu sou <strong>{user.id}</strong>
      </p>

      {/* Placeholder para Feature 05 */}
      <div className="mt-8 rounded-lg border border-border bg-brand-50 p-6">
        <p className="text-sm text-muted-foreground">
          KPI cards e gráficos chegam na Feature 05 (Dashboard Interno).
        </p>
      </div>
    </div>
  );
}
