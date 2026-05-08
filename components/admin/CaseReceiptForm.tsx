"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  caseReceiptSchema,
  type CaseReceiptInput,
} from "@/lib/validators/case";
import {
  createCaseReceipt,
  updateCaseReceipt,
} from "@/lib/actions/case-receipts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface Case {
  id: string;
  numero_processo: string;
}

interface CaseReceiptFormProps {
  clientId: string;
  cases: Case[];
  initialData?: CaseReceiptInput & { id?: string };
  onSuccess?: () => void;
  isLoading?: boolean;
}

/**
 * Formulário para criar/editar recebimento do processo
 */
export function CaseReceiptForm({
  clientId,
  cases,
  initialData,
  onSuccess,
  isLoading: externalLoading,
}: CaseReceiptFormProps) {
  const [loading, setLoading] = useState(externalLoading ?? false);
  const isEdit = !!initialData?.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CaseReceiptInput>({
    resolver: zodResolver(caseReceiptSchema),
    defaultValues: {
      client_id: clientId,
      ...initialData,
    },
  });

  const onSubmit = async (data: CaseReceiptInput) => {
    setLoading(true);
    try {
      let result;
      if (isEdit && initialData?.id) {
        result = await updateCaseReceipt(initialData.id, data);
      } else {
        result = await createCaseReceipt(data);
      }

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          isEdit ? "Recebimento atualizado" : "Recebimento criado"
        );
        onSuccess?.();
      }
    } catch {
      toast.error("Erro ao salvar recebimento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="case_id">Processo *</Label>
          <Select
            value={watch("case_id") || ""}
            onValueChange={(value) => setValue("case_id", value)}
            disabled={loading}
          >
            <SelectTrigger id="case_id">
              <SelectValue placeholder="Selecione um processo" />
            </SelectTrigger>
            <SelectContent>
              {cases.map((caseItem) => (
                <SelectItem key={caseItem.id} value={caseItem.id}>
                  {caseItem.numero_processo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.case_id && (
            <p className="text-xs text-red-600">{errors.case_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <Input
            id="descricao"
            placeholder="Descrição do recebimento"
            disabled={loading}
            {...register("descricao")}
          />
          {errors.descricao && (
            <p className="text-xs text-red-600">{errors.descricao.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              disabled={loading}
              {...register("valor", { valueAsNumber: true })}
            />
            {errors.valor && (
              <p className="text-xs text-red-600">{errors.valor.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data *</Label>
            <Input
              id="data"
              type="date"
              disabled={loading}
              {...register("data")}
            />
            {errors.data && (
              <p className="text-xs text-red-600">{errors.data.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-gradient text-white hover:opacity-90"
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
