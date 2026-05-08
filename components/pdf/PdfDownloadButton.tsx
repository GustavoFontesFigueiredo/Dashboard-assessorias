"use client";

import { useState } from "react";
import { Download, Loader } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "sonner";

interface PdfDownloadButtonProps extends ButtonProps {
  clientId: string;
  period?: "mes" | "trimestre" | "ano";
  label?: string;
}

export function PdfDownloadButton({
  clientId,
  period = "mes",
  label = "Baixar Relatório (PDF)",
  ...props
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/${clientId}/pdf?period=${period}`
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Erro ao gerar PDF");
        return;
      }

      // Criar blob e download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Relatório baixado com sucesso");
    } catch (error) {
      console.error("Erro ao baixar relatório:", error);
      toast.error("Erro ao baixar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      className="gap-2"
      {...props}
    >
      {loading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? "Gerando..." : label}
    </Button>
  );
}
