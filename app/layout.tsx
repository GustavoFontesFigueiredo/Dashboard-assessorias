import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Fontes Figueiredo Advogados",
    template: "%s · FF Advogados",
  },
  description:
    "Dashboard de resultados da assessoria jurídica — custos, condenações evitadas, valores recebidos e ROI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans">{children}</body>
    </html>
  );
}
