"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createCaseUpdate } from "@/lib/actions/case-updates";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tipoOptions = [
  { value: "status_change", label: "Alteração de Status" },
  { value: "fase_change", label: "Alteração de Fase" },
  { value: "valor_change", label: "Alteração de Valor" },
  { value: "observacao", label: "Observação" },
  { value: "documento", label: "Documento" },
  { value: "audiencia", label: "Audiência" },
];

export function AddUpdateForm({
  caseId,
  onSuccess,
}: {
  caseId: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo || !descricao.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createCaseUpdate({
        caseId,
        tipo,
        descricaoTecnica: descricao.trim(),
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Atualização criada com sucesso");
        setOpen(false);
        setTipo("");
        setDescricao("");
        onSuccess?.();
      }
    } catch {
      toast.error("Erro ao criar atualização");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-brand-gradient text-white hover:opacity-90">
          Nova Atualização
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Atualização</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipoOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição Técnica *</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescricao(e.target.value)}
              placeholder="Descreva a atualização..."
              rows={4}
              required
            />
          </div>

          <p className="text-xs text-gray-500">
            A IA gerará automaticamente um resumo para o cliente.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Gerando resumo com IA..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
