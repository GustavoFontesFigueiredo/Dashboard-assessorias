"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listCases } from "@/lib/actions/cases";
import { getCurrentUserClientId } from "@/lib/actions/auth";

interface Case {
  id: string;
  numero_processo: string;
  descricao?: string;
  fase: string;
  status: string;
  valor_pleiteado_contra: number;
  valor_condenado_contra: number;
  valor_condenacao_favoravel: number;
  valor_acordo_recebido: number;
  created_at: string;
}

const faseColors: Record<string, string> = {
  conhecimento: "bg-blue-100 text-blue-800",
  recurso: "bg-yellow-100 text-yellow-800",
  execucao: "bg-purple-100 text-purple-800",
  encerrado: "bg-gray-100 text-gray-800",
};

const statusColors: Record<string, string> = {
  em_andamento: "bg-green-100 text-green-800",
  suspenso: "bg-orange-100 text-orange-800",
  resolvido: "bg-blue-100 text-blue-800",
  arquivado: "bg-gray-100 text-gray-800",
};

export default function ClientCasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; pages: number } | null>(null);

  useEffect(() => {
    const loadCases = async () => {
      try {
        const clientId = await getCurrentUserClientId();
        if (clientId) {
          const result = await listCases(clientId, page, 20);
          if (result.success && result.data) {
            setCases(result.data);
            setPagination(result.pagination);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar processos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, [page]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Link href="/portal">
          <Button variant="outline" size="sm" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Processos</h1>
      </div>

      {/* Lista de Processos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Carregando processos...</p>
        </div>
      ) : cases.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          Nenhum processo registrado
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {cases.map((caseItem) => (
              <Card
                key={caseItem.id}
                className="overflow-hidden border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {caseItem.numero_processo}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          faseColors[caseItem.fase] || "bg-gray-100"
                        }`}
                      >
                        {caseItem.fase.charAt(0).toUpperCase() + caseItem.fase.slice(1)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusColors[caseItem.status] || "bg-gray-100"
                        }`}
                      >
                        {caseItem.status.replace(/_/g, " ").charAt(0).toUpperCase() +
                          caseItem.status.slice(1).replace(/_/g, " ")}
                      </span>
                    </div>

                    {caseItem.descricao && (
                      <p className="mt-2 text-sm text-gray-600">
                        {caseItem.descricao}
                      </p>
                    )}

                    {/* Valores */}
                    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                      {caseItem.valor_pleiteado_contra > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">
                            Valor Pleiteado
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(caseItem.valor_pleiteado_contra)}
                          </p>
                        </div>
                      )}
                      {caseItem.valor_condenado_contra > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">
                            Valor Condenado
                          </p>
                          <p className="text-sm font-semibold text-red-600">
                            {formatCurrency(caseItem.valor_condenado_contra)}
                          </p>
                        </div>
                      )}
                      {caseItem.valor_condenacao_favoravel > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">
                            Condenação Favorável
                          </p>
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(
                              caseItem.valor_condenacao_favoravel
                            )}
                          </p>
                        </div>
                      )}
                      {caseItem.valor_acordo_recebido > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">
                            Acordo Recebido
                          </p>
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(caseItem.valor_acordo_recebido)}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-gray-400">
                      Criado em:{" "}
                      {new Date(caseItem.created_at).toLocaleDateString(
                        "pt-BR"
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
