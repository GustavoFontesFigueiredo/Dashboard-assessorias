import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware para proteção de rotas e redirecionamento baseado em autenticação.
 * Executado em edge, portanto deve ser leve.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas (sem autenticação necessária)
  if (pathname === "/login" || pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Cria cliente Supabase para ler sessão dos cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: Record<string, unknown>;
          }>,
        ) {
          const response = NextResponse.next();
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          return response;
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sem sessão ativa
  if (!user) {
    // Rota raiz → login
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Rota protegida → login
    if (
      pathname.startsWith("/internal/") ||
      pathname.startsWith("/client/")
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Usuário autenticado — pega seu perfil para checar role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  // Redireciona /login → dashboard apropriado se já logado
  if (pathname === "/login") {
    if (role === "cliente") {
      return NextResponse.redirect(new URL("/client/portal", request.url));
    }
    // Admin, controller, advogado → dashboard interno
    return NextResponse.redirect(new URL("/internal/dashboard", request.url));
  }

  // Rotas internas: só internos (admin, controller, advogado)
  if (pathname.startsWith("/internal/")) {
    if (!["admin", "controller", "advogado"].includes(role)) {
      return NextResponse.redirect(new URL("/client/portal", request.url));
    }
  }

  // Rotas de cliente: só clientes
  if (pathname.startsWith("/client/")) {
    if (role !== "cliente") {
      return NextResponse.redirect(new URL("/internal/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Configuração de rotas protegidas pelo middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
