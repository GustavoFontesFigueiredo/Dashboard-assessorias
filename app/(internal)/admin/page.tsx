import { getSessionUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Painel Administrativo",
};

export default async function AdminDashboardPage() {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="space-y-6 p-6">
      <AdminHeader
        title="Painel Administrativo"
        subtitle="Bem-vindo ao painel de controle"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Clientes Ativos</p>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">
              Atualizar em Feature 05
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Usuários Internos</p>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">
              Atualizar em Feature 05
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Processos Totais</p>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">
              Atualizar em Feature 04
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
