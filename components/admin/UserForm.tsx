"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { userCreateSchema, roleEnum, type UserCreateInput } from "@/lib/validators/user";
import { createUser, updateUser } from "@/lib/actions/users";
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

interface UserFormProps {
  initialData?: Partial<UserCreateInput> & { id?: string };
  onSuccess?: () => void;
  isLoading?: boolean;
}

/**
 * Formulário para criar/editar usuário
 */
export function UserForm({
  initialData,
  onSuccess,
  isLoading: externalLoading,
}: UserFormProps) {
  const [loading, setLoading] = useState(externalLoading ?? false);
  const isEdit = !!initialData?.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UserCreateInput>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: initialData,
  });

  const roleValue = watch("role");

  const onSubmit = async (data: UserCreateInput) => {
    setLoading(true);
    try {
      let result;
      if (isEdit && initialData?.id) {
        result = await updateUser(initialData.id, {
          nome: data.nome,
          role: data.role,
        });
      } else {
        result = await createUser(data);
      }

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          isEdit ? "Usuário atualizado" : "Usuário criado",
        );
        onSuccess?.();
      }
    } catch {
      toast.error("Erro ao salvar usuário");
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isEdit && (
          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@example.com"
              disabled={loading}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            placeholder="Nome completo"
            disabled={loading}
            {...register("nome")}
          />
          {errors.nome && (
            <p className="text-xs text-red-600">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Papel *</Label>
          <Select
            value={roleValue || ""}
            onValueChange={(value) => setValue("role", value as any)}
            disabled={loading}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Selecione um papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="controller">Controller</SelectItem>
              <SelectItem value="advogado">Advogado</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-xs text-red-600">{errors.role.message}</p>
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

        {!isEdit && (
          <p className="text-xs text-muted-foreground">
            Nota: Uma senha temporária será gerada. O usuário deve fazer login
            e alterá-la na primeira vez.
          </p>
        )}
      </form>
    </Card>
  );
}
