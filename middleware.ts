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

  // Garante que as variáveis de ambiente existem
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Env vars ausentes → redireciona para login por segurança
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Response mutável para repassar cookies de sessão atualizados
  let response = NextResponse.next({ request });

  try {
    // Cria cliente Supabase para ler sessão dos cookies
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(
              name,
              value,
              options as Parameters<typeof response.cookies.set>[2],
            ),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Sem sessão ativa → redireciona para login
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Usuário autenticado — pega seu perfil para checar role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as string | undefined;

    // Usuário já logado tenta acessar /login → redireciona ao dashboard correto
    if (pathname === "/login") {
      if (role === "cliente") {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Rotas internas: apenas admin, controller e advogado
    const internalRoutes = ["/dashboard", "/clients", "/cases", "/users", "/assignments"];
    if (internalRoutes.some((route) => pathname.startsWith(route))) {
      if (!role || !["admin", "controller", "advogado"].includes(role)) {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
    }

    // Rotas de cliente: apenas role "cliente"
    if (pathname.startsWith("/portal")) {
      if (role !== "cliente") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return response;
  } catch {
    // Qualquer erro inesperado → redireciona para login por segurança
    return NextResponse.redirect(new URL("/login", request.url));
  }
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
