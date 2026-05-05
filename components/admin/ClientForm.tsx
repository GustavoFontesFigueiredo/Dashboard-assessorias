"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { clientCreateSchema, type ClientCreateInput } from "@/lib/validators/client";
import { createClient, updateClient } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface ClientFormProps {
  initialData?: ClientCreateInput & { id?: string };
  onSuccess?: () => void;
  isLoading?: boolean;
}

/**
 * Formulário para criar/editar cliente
 */
export function ClientForm({
  initialData,
  onSuccess,
  isLoading: externalLoading,
}: ClientFormProps) {
  const [loading, setLoading] = useState(externalLoading ?? false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientCreateInput>({
    resolver: zodResolver(clientCreateSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: ClientCreateInput) => {
    setLoading(true);
    try {
      let result;
      if (initialData?.id) {
        result = await updateClient(initialData.id, data);
      } else {
        result = await createClient(data);
      }

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          initialData?.id ? "Cliente atualizado" : "Cliente criado",
        );
        onSuccess?.();
      }
    } catch {
      toast.error("Erro ao salvar cliente");
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="razaoSocial">Razão Social *</Label>
          <Input
            id="razaoSocial"
            placeholder="Nome da empresa"
            disabled={loading}
            {...register("razaoSocial")}
          />
          {errors.razaoSocial && (
            <p className="text-xs text-red-600">
              {errors.razaoSocial.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            placeholder="XX.XXX.XXX/0001-XX"
            disabled={loading}
            {...register("cnpj")}
          />
          {errors.cnpj && (
            <p className="text-xs text-red-600">{errors.cnpj.message}</p>
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
