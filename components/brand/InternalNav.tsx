"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Clientes", href: "/admin/clients" },
  { label: "Processos", href: "/admin/cases" },
  { label: "Lançamentos", href: "/admin/case-costs" },
  { label: "Recebimentos", href: "/admin/case-receipts" },
  { label: "Usuários", href: "/admin/users" },
];

export function InternalNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-white/20 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}

      <button
        onClick={handleLogout}
        className="ml-2 flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        title="Sair"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </nav>
  );
}
