import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Painel Administrativo",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-56 border-r border-border bg-white">
        <nav className="space-y-1 p-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
          </Link>
          <Link href="/admin/clients">
            <Button variant="ghost" className="w-full justify-start">Clientes</Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start">Usuários</Button>
          </Link>
          <Link href="/admin/assignments">
            <Button variant="ghost" className="w-full justify-start">Atribuições</Button>
          </Link>
          <div className="my-4 border-t border-border" />
          <Link href="/admin/cases">
            <Button variant="ghost" className="w-full justify-start">Processos</Button>
          </Link>
          <Link href="/admin/case-costs">
            <Button variant="ghost" className="w-full justify-start">Custos</Button>
          </Link>
          <Link href="/admin/case-receipts">
            <Button variant="ghost" className="w-full justify-start">Recebimentos</Button>
          </Link>
          <div className="my-4 border-t border-border" />
          <Link href="/admin/reports">
            <Button variant="ghost" className="w-full justify-start">Relatórios Mensais</Button>
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
