"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, FileText, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  createMeetingMinute,
  listMeetingMinutes,
  prepareMeetingMinute,
  publishMeetingMinute,
} from "@/lib/actions/meeting-minutes";
import { listAssignableUsers } from "@/lib/actions/users";

interface Lawyer {
  id: string;
  nome: string;
  role: string;
}

interface MeetingMinute {
  id: string;
  responsavel_id: string;
  responsavel_nome: string;
  meeting_date: string;
  scope: string | null;
  participants: string[] | null;
  status: string;
  timebox_minutes: number;
  categories_count: number;
  tasks_count: number;
  updated_at: string;
}

interface CurrentUser {
  id: string;
  role: "admin" | "controller" | "advogado" | "cliente";
  nome: string;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  prepared: "Preparada",
  in_progress: "Em reuniao",
  completed: "Fechada",
  published: "Publicada",
  cancelled: "Cancelada",
};

export default function MeetingMinutesPage() {
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    responsavelId: "",
    meetingDate: new Date().toISOString().slice(0, 10),
    scope: "",
    participants: "",
    timeboxMinutes: 40,
  });

  const isLawyer = currentUser?.role === "advogado";

  const lawyerOptions = useMemo(() => {
    if (!currentUser) return lawyers;
    if (isLawyer) {
      return [{ id: currentUser.id, nome: currentUser.nome, role: currentUser.role }];
    }
    return lawyers;
  }, [currentUser, isLawyer, lawyers]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [minutesResult, lawyersResult, userResult] = await Promise.all([
        listMeetingMinutes(),
        listAssignableUsers(),
        getCurrentUser(),
      ]);

      if (minutesResult.success && Array.isArray(minutesResult.data)) {
        setMinutes(minutesResult.data as MeetingMinute[]);
      } else if (minutesResult.error) {
        toast.error(minutesResult.error);
      }

      if ("data" in lawyersResult && Array.isArray(lawyersResult.data)) {
        setLawyers(lawyersResult.data as Lawyer[]);
      }

      if (userResult) {
        setCurrentUser(userResult as CurrentUser);
        if (userResult.role === "advogado") {
          setForm((prev) => ({ ...prev, responsavelId: userResult.id }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!form.responsavelId) {
      toast.error("Selecione o advogado responsavel");
      return;
    }

    setSaving(true);
    const result = await createMeetingMinute({
      responsavelId: form.responsavelId,
      meetingDate: form.meetingDate,
      scope: form.scope || null,
      participants: form.participants
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      timeboxMinutes: form.timeboxMinutes,
    });

    if (result.success) {
      toast.success("Ata criada");
      setOpen(false);
      await loadData();
    } else {
      toast.error(result.error || "Erro ao criar ata");
    }
    setSaving(false);
  };

  const handlePrepare = async (id: string) => {
    setSaving(true);
    const result = await prepareMeetingMinute(id);
    if (result.success) {
      toast.success("Pauta consolidada preparada");
      await loadData();
    } else {
      toast.error(result.error || "Erro ao preparar pauta");
    }
    setSaving(false);
  };

  const handlePublish = async (id: string) => {
    if (!confirm("Publicar e travar esta ata para edicao pelo advogado?")) return;
    setSaving(true);
    const result = await publishMeetingMinute(id);
    if (result.success) {
      toast.success("Ata publicada");
      await loadData();
    } else {
      toast.error(result.error || "Erro ao publicar ata");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 p-6">
      <AdminHeader
        title="Atas Quinzenais"
        breadcrumbs={[{ label: "Atas" }]}
        subtitle="Reunioes curtas por advogado, com pauta consolidada por categorias e tarefas de follow-up"
        actions={
          <Button
            className="gap-2 bg-brand-gradient text-white hover:opacity-90"
            onClick={() => {
              if (isLawyer && currentUser) {
                setForm((prev) => ({ ...prev, responsavelId: currentUser.id }));
              }
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nova ata
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ClipboardList className="h-4 w-4 text-brand-600" />
              Modelo da rotina
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Uma ata por advogado responsavel, agrupando a carteira em categorias.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-brand-600" />
              Timebox
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Reuniao planejada para 30 a 50 minutos, com decisoes em bloco.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-brand-600" />
              Publicacao
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Depois de publicada, somente Admin e Controller podem editar.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Carregando atas...
            </div>
          ) : minutes.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma ata criada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-brand-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold">Responsavel</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Categorias</th>
                    <th className="px-4 py-3 font-semibold">Tarefas</th>
                    <th className="px-4 py-3 text-right font-semibold">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {minutes.map((minute) => (
                    <tr key={minute.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        {new Date(`${minute.meeting_date}T12:00:00`).toLocaleDateString(
                          "pt-BR",
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{minute.responsavel_nome}</div>
                        {minute.scope && (
                          <div className="text-xs text-muted-foreground">
                            {minute.scope}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-brand-50 px-2 py-1 text-xs font-medium text-brand-800">
                          {statusLabels[minute.status] || minute.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{minute.categories_count}</td>
                      <td className="px-4 py-3">{minute.tasks_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                          >
                            <Link href={`/admin/meeting-minutes/${minute.id}`}>Abrir</Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={saving || minute.status === "published"}
                            onClick={() => handlePrepare(minute.id)}
                          >
                            Preparar pauta
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={saving || minute.status === "published"}
                            onClick={() => handlePublish(minute.id)}
                          >
                            Publicar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova ata quinzenal</DialogTitle>
            <DialogDescription>
              Crie uma ata por advogado responsavel. A pauta sera consolidada por
              categorias da carteira.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Advogado responsavel</Label>
              <Select
                value={form.responsavelId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, responsavelId: value }))
                }
                disabled={isLawyer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {lawyerOptions.map((lawyer) => (
                    <SelectItem key={lawyer.id} value={lawyer.id}>
                      {lawyer.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data da reuniao</Label>
                <Input
                  type="date"
                  value={form.meetingDate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, meetingDate: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Timebox (min)</Label>
                <Input
                  type="number"
                  min={30}
                  max={50}
                  value={form.timeboxMinutes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      timeboxMinutes: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Escopo ou area</Label>
              <Input
                value={form.scope}
                placeholder="Ex: Carteira trabalhista"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, scope: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Participantes</Label>
              <Input
                value={form.participants}
                placeholder="Nomes separados por virgula"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, participants: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar ata
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
