"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser } from "@/lib/actions/users";

interface Props {
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}

export function PortalUserForm({ clientId, clientName, onSuccess }: Props) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createUser({
      nome,
      email,
      role: "cliente",
      clientId,
    });

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setCreatedPassword(result.tempPassword ?? null);
    toast.success("Acesso ao portal criado com sucesso!");
    onSuccess?.();
  };

  const copyPassword = async () => {
    if (!createdPassword) return;
    await navigator.clipboard.writeText(createdPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tela de sucesso — exibe a senha gerada
  if (createdPassword) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Acesso criado com sucesso!</p>
          <p className="mt-1">
            O usuário <strong>{email}</strong> já pode acessar o portal de{" "}
            <strong>{clientName}</strong>.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Senha temporária</Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={createdPassword}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyPassword}
              className="shrink-0"
            >
              {copied ? (
                <CheckCheck className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Anote e envie esta senha ao usuário. Ela não será exibida novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cria um login de acesso ao portal para <strong>{clientName}</strong>.
        Uma senha temporária será gerada automaticamente.
      </p>

      <div className="space-y-2">
        <Label htmlFor="portal-nome">Nome completo</Label>
        <Input
          id="portal-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: João Silva"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="portal-email">E-mail</Label>
        <Input
          id="portal-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="joao@empresa.com.br"
          required
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-gradient text-white hover:opacity-90"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        {loading ? "Criando acesso..." : "Criar acesso ao portal"}
      </Button>
    </form>
  );
}
