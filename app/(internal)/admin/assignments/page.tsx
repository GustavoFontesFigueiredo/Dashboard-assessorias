"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AssignmentMatrix } from "@/components/admin/AssignmentMatrix";
import { listAssignableUsers } from "@/lib/actions/users";
import { listClients } from "@/lib/actions/clients";
import { listAssignments } from "@/lib/actions/assignments";

interface Lawyer {
  id: string;
  nome: string;
}

interface Client {
  id: string;
  razao_social: string;
}

interface Assignment {
  advogado_id: string;
  client_id: string;
}

export default function AssignmentsPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lawyersResult, clientsResult, assignmentsResult] = await Promise.all(
        [
          listAssignableUsers(),
          listClients(1, 100),
          listAssignments(),
        ]
      );

      if ("data" in lawyersResult && Array.isArray(lawyersResult.data)) {
        setLawyers(
          lawyersResult.data.map((u: { id: string; nome: string }) => ({
            id: u.id,
            nome: u.nome,
          }))
        );
      }

      if (clientsResult.success && Array.isArray(clientsResult.data)) {
        setClients(clientsResult.data);
      }

      if (
        assignmentsResult.success &&
        Array.isArray(assignmentsResult.data)
      ) {
        setAssignments(
          assignmentsResult.data.map((a: { advogado_id: string; client_id: string }) => ({
            advogado_id: a.advogado_id,
            client_id: a.client_id,
          }))
        );
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <AdminHeader
        title="Atribuições"
        breadcrumbs={[{ label: "Atribuições" }]}
        subtitle="Atribua advogados aos clientes"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Carregando dados...</p>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-6">
          <AssignmentMatrix
            lawyers={lawyers}
            clients={clients}
            initialAssignments={assignments}
            onUpdate={loadData}
          />
        </div>
      )}
    </div>
  );
}
