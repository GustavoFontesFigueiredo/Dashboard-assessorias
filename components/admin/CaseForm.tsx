"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { caseCreateSchema, type CaseCreateInput } from "@/lib/validators/case";
import { createCase, updateCase } from "@/lib/actions/cases";
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

interface Lawyer {
  id: string;
  nome: string;
}

interface CaseFormProps {
  clientId: string;
  initialData?: CaseCreateInput & { id?: string };
  lawyers: Lawyer[];
  onSuccess?: () => void;
  isLoading?: boolean;
}

/**
 * Formulário para criar/editar processo
 */
export function CaseForm({
  clientId,
  initialData,
  lawyers,
  onSuccess,
  isLoading: externalLoading,
}: CaseFormProps) {
  const [loading, setLoading] = useState(externalLoading ?? false);
  const isEdit = !!initialData?.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CaseCreateInput>({
    resolver: zodResolver(caseCreateSchema),
    defaultValues: {
      client_id: clientId,
      ...initialData,
    },
  });

  const faseValue = watch("fase");
  const statusValue = watch("status");

  const onSubmit = async (data: CaseCreateInput) => {
    setLoading(true);
    try {
      let result;
      if (isEdit && initialData?.id) {
        result = await updateCase(initialData.id, {
          ...data,
          client_id: undefined,
        });
      } else {
        result = await createCase(data);
      }

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          isEdit ? "Processo atualizado" : "Processo criado"
        );
        onSuccess?.();
      }
    } catch {
      toast.error("Erro ao salvar processo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="numero_processo">Número do Processo *</Label>
          <Input
            id="numero_processo"
            placeholder="0000000-00.0000.0.00.0000"
            disabled={loading}
            {...register("numero_processo")}
          />
          {errors.numero_processo && (
            <p className="text-xs text-red-600">{errors.numero_processo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <textarea
            id="descricao"
            placeholder="Descrição do processo"
            disabled={loading}
            className="min-h-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
            {...register("descricao")}
          />
          {errors.descricao && (
            <p className="text-xs text-red-600">{errors.descricao.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fase">Fase *</Label>
            <Select
              value={faseValue || ""}
              onValueChange={(value) => setValue("fase", value as any)}
              disabled={loading}
            >
              <SelectTrigger id="fase">
                <SelectValue placeholder="Selecione a fase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conhecimento">Conhecimento</SelectItem>
                <SelectItem value="recurso">Recurso</SelectItem>
                <SelectItem value="execucao">Execução</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
            {errors.fase && (
              <p className="text-xs text-red-600">{errors.fase.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={statusValue || ""}
              onValueChange={(value) => setValue("status", value as any)}
              disabled={loading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-xs text-red-600">{errors.status.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valor_pleiteado_contra">Valor Pleiteado Contra</Label>
            <Input
              id="valor_pleiteado_contra"
              type="number"
              step="0.01"
              placeholder="0,00"
              disabled={loading}
              {...register("valor_pleiteado_contra", { valueAsNumber: true })}
            />
            {errors.valor_pleiteado_contra && (
              <p className="text-xs text-red-600">
                {errors.valor_pleiteado_contra.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_condenado_contra">Valor Condenado Contra</Label>
            <Input
              id="valor_condenado_contra"
              type="number"
              step="0.01"
              placeholder="0,00"
              disabled={loading}
              {...register("valor_condenado_contra", { valueAsNumber: true })}
            />
            {errors.valor_condenado_contra && (
              <p className="text-xs text-red-600">
                {errors.valor_condenado_contra.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valor_condenacao_favoravel">
              Valor Condenação Favorável
            </Label>
            <Input
              id="valor_condenacao_favoravel"
              type="number"
              step="0.01"
              placeholder="0,00"
              disabled={loading}
              {...register("valor_condenacao_favoravel", { valueAsNumber: true })}
            />
            {errors.valor_condenacao_favoravel && (
              <p className="text-xs text-red-600">
                {errors.valor_condenacao_favoravel.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_acordo_recebido">Valor Acordo Recebido</Label>
            <Input
              id="valor_acordo_recebido"
              type="number"
              step="0.01"
              placeholder="0,00"
              disabled={loading}
              {...register("valor_acordo_recebido", { valueAsNumber: true })}
            />
            {errors.valor_acordo_recebido && (
              <p className="text-xs text-red-600">
                {errors.valor_acordo_recebido.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="advogado_responsavel_id">Advogado Responsável</Label>
          <Select
            value={watch("advogado_responsavel_id") || ""}
            onValueChange={(value) =>
              setValue("advogado_responsavel_id", value)
            }
            disabled={loading}
          >
            <SelectTrigger id="advogado_responsavel_id">
              <SelectValue placeholder="Selecione um advogado" />
            </SelectTrigger>
            <SelectContent>
              {lawyers.map((lawyer) => (
                <SelectItem key={lawyer.id} value={lawyer.id}>
                  {lawyer.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.advogado_responsavel_id && (
            <p className="text-xs text-red-600">
              {errors.advogado_responsavel_id.message}
            </p>
          )}
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
