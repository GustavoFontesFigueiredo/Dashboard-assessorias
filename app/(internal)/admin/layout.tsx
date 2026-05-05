import Link from "next/link";
import { getSessionUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Painel Administrativo",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-56 border-r border-border bg-white">
        <nav className="space-y-1 p-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link href={"/internal/admin" as any}>
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              Dashboard
            </Button>
          </Link>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link href={"/internal/admin/clients" as any}>
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              Clientes
            </Button>
          </Link>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link href={"/internal/admin/users" as any}>
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              Usuários
            </Button>
          </Link>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link href={"/internal/admin/assignments" as any}>
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              Atribuições
            </Button>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-56 bg-brand-50 min-h-[calc(100vh-64px)]">
        {children}
      </main>
    </div>
  );
}
