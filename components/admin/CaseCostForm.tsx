"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { caseCostSchema, type CaseCostInput } from "@/lib/validators/case";
import { createCaseCost, updateCaseCost } from "@/lib/actions/case-costs";
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

interface CaseCostFormProps {
  clientId: string;
  cases: Case[];
  initialData?: CaseCostInput & { id?: string };
  onSuccess?: () => void;
  isLoading?: boolean;
}

/**
 * Formulário para criar/editar custo do processo
 */
export function CaseCostForm({
  clientId,
  cases,
  initialData,
  onSuccess,
  isLoading: externalLoading,
}: CaseCostFormProps) {
  const [loading, setLoading] = useState(externalLoading ?? false);
  const isEdit = !!initialData?.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CaseCostInput>({
    resolver: zodResolver(caseCostSchema),
    defaultValues: {
      client_id: clientId,
      ...initialData,
    },
  });

  const tipoValue = watch("tipo");

  const onSubmit = async (data: CaseCostInput) => {
    setLoading(true);
    try {
      let result;
      if (isEdit && initialData?.id) {
        result = await updateCaseCost(initialData.id, data);
      } else {
        result = await createCaseCost(data);
      }

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          isEdit ? "Custo atualizado" : "Custo criado"
        );
        onSuccess?.();
      }
    } catch {
      toast.error("Erro ao salvar custo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="case_id">Processo</Label>
          <Select
            value={watch("case_id") || ""}
            onValueChange={(value) => setValue("case_id", value)}
            disabled={loading}
          >
            <SelectTrigger id="case_id">
              <SelectValue placeholder="Selecione um processo (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {cases.map((caseItem) => (
                <SelectItem key={caseItem.id} value={caseItem.id}>
                  {caseItem.numero_processo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Custo *</Label>
          <Select
            value={tipoValue || ""}
            onValueChange={(value) => setValue("tipo", value as any)}
            disabled={loading}
          >
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="honorario_fixo">Honorário Fixo</SelectItem>
              <SelectItem value="honorario_variavel">Honorário Variável</SelectItem>
              <SelectItem value="custas">Custas</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          {errors.tipo && (
            <p className="text-xs text-red-600">{errors.tipo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <Input
            id="descricao"
            placeholder="Descrição do custo"
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
            <Label htmlFor="data_competencia">Data de Competência *</Label>
            <Input
              id="data_competencia"
              type="date"
              disabled={loading}
              {...register("data_competencia")}
            />
            {errors.data_competencia && (
              <p className="text-xs text-red-600">
                {errors.data_competencia.message}
              </p>
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
