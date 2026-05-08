"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { assignLawyer, unassignLawyer } from "@/lib/actions/assignments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

interface AssignmentMatrixProps {
  lawyers: Lawyer[];
  clients: Client[];
  initialAssignments: Assignment[];
  onUpdate?: () => void;
}

function DraggableLawyerCard({ lawyer }: { lawyer: Lawyer }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: lawyer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-brand-gradient text-white rounded-lg p-4 cursor-move shadow-sm hover:shadow-md transition-shadow"
    >
      <p className="font-semibold text-sm">{lawyer.nome}</p>
    </div>
  );
}

function DropZoneCell({
  lawyerId,
  clientId,
  clientName: _clientName,
  isAssigned,
  onRemove,
}: {
  lawyerId: string;
  clientId: string;
  clientName: string;
  isAssigned: boolean;
  onRemove: (lawyerId: string, clientId: string) => void;
}) {
  const { setNodeRef, isOver } = useSortable({
    id: `${lawyerId}-${clientId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-20 rounded-lg p-3 border-2 transition-colors ${
        isOver
          ? "border-brand-gradient bg-brand-50 border-dashed"
          : isAssigned
            ? "border-green-500 bg-green-50"
            : "border-gray-200 bg-white"
      }`}
    >
      {isAssigned && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-green-700">✓ Atribuído</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            onClick={() => onRemove(lawyerId, clientId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function AssignmentMatrix({
  lawyers,
  clients,
  initialAssignments,
  onUpdate,
}: AssignmentMatrixProps) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [_loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || !active) return;

      // Extract IDs from the sortable IDs
      const _fromId = String(active.id);
      const toId = String(over.id);

      // Check if this is a drop on a zone cell (format: "lawyerId-clientId")
      if (!toId.includes("-")) return;

      const [lawyerId, clientId] = toId.split("-");

      if (!lawyerId || !clientId) return;

      // Check if already assigned
      const isAlreadyAssigned = assignments.some(
        (a) => a.advogado_id === lawyerId && a.client_id === clientId
      );

      if (isAlreadyAssigned) {
        toast.info("Advogado já atribuído a este cliente");
        return;
      }

      setLoading(true);
      try {
        const result = await assignLawyer({
          advogadoId: lawyerId,
          clientId: clientId,
        });

        if ("error" in result && result.error) {
          toast.error(result.error);
        } else {
          setAssignments([
            ...assignments,
            { advogado_id: lawyerId, client_id: clientId },
          ]);
          toast.success("Advogado atribuído ao cliente");
          onUpdate?.();
        }
      } catch {
        toast.error("Erro ao atribuir advogado");
      } finally {
        setLoading(false);
      }
    },
    [assignments, onUpdate]
  );

  const handleRemoveAssignment = useCallback(
    async (lawyerId: string, clientId: string) => {
      setLoading(true);
      try {
        const result = await unassignLawyer(lawyerId, clientId);

        if ("error" in result && result.error) {
          toast.error(result.error);
        } else {
          setAssignments(
            assignments.filter(
              (a) => !(a.advogado_id === lawyerId && a.client_id === clientId)
            )
          );
          toast.success("Atribuição removida");
          onUpdate?.();
        }
      } catch {
        toast.error("Erro ao remover atribuição");
      } finally {
        setLoading(false);
      }
    },
    [assignments, onUpdate]
  );

  const lawyerIds = lawyers.map((l) => l.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-2 gap-6">
        {/* Advogados Column */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Advogados</h3>
          <div className="space-y-3">
            <SortableContext
              items={lawyerIds}
              strategy={verticalListSortingStrategy}
            >
              {lawyers.map((lawyer) => (
                <DraggableLawyerCard key={lawyer.id} lawyer={lawyer} />
              ))}
            </SortableContext>
          </div>
          {lawyers.length === 0 && (
            <Card className="p-4 bg-gray-50">
              <p className="text-sm text-gray-500">Nenhum advogado disponível</p>
            </Card>
          )}
        </div>

        {/* Clients Column */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Clientes</h3>
          <div className="space-y-6">
            {clients.map((client) => (
              <Card key={client.id} className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  {client.razao_social}
                </h4>
                <div className="space-y-2">
                  {lawyers.map((lawyer) => {
                    const isAssigned = assignments.some(
                      (a) =>
                        a.advogado_id === lawyer.id && a.client_id === client.id
                    );

                    return (
                      <DropZoneCell
                        key={`${lawyer.id}-${client.id}`}
                        lawyerId={lawyer.id}
                        clientId={client.id}
                        clientName={client.razao_social}
                        isAssigned={isAssigned}
                        onRemove={handleRemoveAssignment}
                      />
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
          {clients.length === 0 && (
            <Card className="p-4 bg-gray-50">
              <p className="text-sm text-gray-500">Nenhum cliente disponível</p>
            </Card>
          )}
        </div>
      </div>
    </DndContext>
  );
}
