"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  createMeetingTask,
  createSpotlightItem,
  getMeetingMinute,
  listMeetingMinuteCategories,
  listMeetingTasks,
  listSpotlightItems,
  listSpotlightOptions,
  prepareMeetingMinute,
  publishMeetingMinute,
  updateMeetingMinuteCategory,
  updateMeetingTask,
  updateSpotlightItem,
} from "@/lib/actions/meeting-minutes";
import { listAssignableUsers } from "@/lib/actions/users";

interface CurrentUser {
  id: string;
  role: "admin" | "controller" | "advogado" | "cliente";
  nome: string;
}

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
  portfolio_snapshot_json: Record<string, unknown>;
  summary: string | null;
}

interface Category {
  id: string;
  category_key: string;
  title: string;
  items_count: number;
  items_json: Array<Record<string, unknown>>;
  decision_mode: "block" | "partial" | "individual" | "skip";
  decision_text: string | null;
  owner_id: string | null;
  due_date: string | null;
}

interface SpotlightItem {
  id: string;
  client_id: string | null;
  case_id: string | null;
  reason: string;
  discussion_notes: string | null;
  decision_text: string | null;
  owner_id: string | null;
  due_date: string | null;
  client_name: string | null;
  case_number: string | null;
  case_description: string | null;
}

interface SpotlightClient {
  id: string;
  razao_social: string;
}

interface SpotlightCase {
  id: string;
  client_id: string;
  numero_processo: string;
  descricao: string | null;
  status: string;
}

interface MeetingTask {
  id: string;
  spotlight_item_id: string | null;
  client_name: string | null;
  case_number: string | null;
  owner_name: string | null;
  title: string;
  description: string | null;
  status: "open" | "done" | "cancelled";
  due_date: string | null;
  source: string;
}

interface CategoryDraft {
  decisionMode: "block" | "partial" | "individual" | "skip";
  decisionText: string;
  ownerId: string;
  dueDate: string;
}

interface SpotlightDraft {
  decisionText: string;
  ownerId: string;
  dueDate: string;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  prepared: "Preparada",
  in_progress: "Em reuniao",
  completed: "Fechada",
  published: "Publicada",
  cancelled: "Cancelada",
};

const decisionModeLabels: Record<Category["decision_mode"], string> = {
  block: "Decisao em bloco",
  partial: "Parcial",
  individual: "Individual",
  skip: "Ignorar agora",
};

const taskSourceLabels: Record<string, string> = {
  manual: "Manual",
  block_decision: "Decisao em bloco",
  spotlight_decision: "Caso destacado",
  future_transcription_ai: "Transcricao futura",
};

const taskStatusLabels: Record<MeetingTask["status"], string> = {
  open: "Aberta",
  done: "Concluida",
  cancelled: "Cancelada",
};

export default function MeetingMinuteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const minuteId = params.id;

  const [minute, setMinute] = useState<MeetingMinute | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<MeetingTask[]>([]);
  const [spotlights, setSpotlights] = useState<SpotlightItem[]>([]);
  const [spotlightClients, setSpotlightClients] = useState<SpotlightClient[]>([]);
  const [spotlightCases, setSpotlightCases] = useState<SpotlightCase[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [drafts, setDrafts] = useState<Record<string, CategoryDraft>>({});
  const [spotlightDrafts, setSpotlightDrafts] = useState<Record<string, SpotlightDraft>>(
    {},
  );
  const [spotlightClientId, setSpotlightClientId] = useState("none");
  const [spotlightCaseId, setSpotlightCaseId] = useState("none");
  const [spotlightReason, setSpotlightReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const canEdit =
    !!minute &&
    (minute.status !== "published" ||
      currentUser?.role === "admin" ||
      currentUser?.role === "controller");

  const ownerOptions = useMemo(() => {
    const byId = new Map<string, Lawyer>();
    lawyers.forEach((lawyer) => byId.set(lawyer.id, lawyer));
    if (minute && !byId.has(minute.responsavel_id)) {
      byId.set(minute.responsavel_id, {
        id: minute.responsavel_id,
        nome: minute.responsavel_nome,
        role: "advogado",
      });
    }
    return [...byId.values()];
  }, [lawyers, minute]);

  const filteredSpotlightCases = useMemo(() => {
    if (spotlightClientId === "none") return spotlightCases;
    return spotlightCases.filter((caseItem) => caseItem.client_id === spotlightClientId);
  }, [spotlightCases, spotlightClientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        minuteResult,
        categoriesResult,
        tasksResult,
        spotlightsResult,
        spotlightOptionsResult,
        lawyersResult,
        user,
      ] = await Promise.all([
        getMeetingMinute(minuteId),
        listMeetingMinuteCategories(minuteId),
        listMeetingTasks(minuteId),
        listSpotlightItems(minuteId),
        listSpotlightOptions(minuteId),
        listAssignableUsers(),
        getCurrentUser(),
      ]);

      if (minuteResult.success && minuteResult.data) {
        setMinute(minuteResult.data as MeetingMinute);
      } else {
        toast.error(minuteResult.error || "Ata nao encontrada");
      }

      if (categoriesResult.success && Array.isArray(categoriesResult.data)) {
        const categoryData = categoriesResult.data as Category[];
        setCategories(categoryData);
        setDrafts(
          Object.fromEntries(
            categoryData.map((category) => [
              category.id,
              {
                decisionMode: category.decision_mode,
                decisionText: category.decision_text || "",
                ownerId: category.owner_id || "none",
                dueDate: category.due_date || "",
              },
            ]),
          ),
        );
      }

      if (tasksResult.success && Array.isArray(tasksResult.data)) {
        setTasks(tasksResult.data as MeetingTask[]);
      }

      if (spotlightsResult.success && Array.isArray(spotlightsResult.data)) {
        const spotlightData = spotlightsResult.data as SpotlightItem[];
        setSpotlights(spotlightData);
        setSpotlightDrafts(
          Object.fromEntries(
            spotlightData.map((item) => [
              item.id,
              {
                decisionText: item.decision_text || "",
                ownerId: item.owner_id || minuteResult.data?.responsavel_id || "none",
                dueDate: item.due_date || "",
              },
            ]),
          ),
        );
      }

      if (spotlightOptionsResult.success && spotlightOptionsResult.data) {
        setSpotlightClients(spotlightOptionsResult.data.clients as SpotlightClient[]);
        setSpotlightCases(spotlightOptionsResult.data.cases as SpotlightCase[]);
      }

      if ("data" in lawyersResult && Array.isArray(lawyersResult.data)) {
        setLawyers(lawyersResult.data as Lawyer[]);
      }

      if (user) setCurrentUser(user as CurrentUser);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minuteId]);

  const handlePrepare = async () => {
    setSavingId("prepare");
    const result = await prepareMeetingMinute(minuteId);
    if (result.success) {
      toast.success("Pauta preparada");
      await loadData();
    } else {
      toast.error(result.error || "Erro ao preparar pauta");
    }
    setSavingId(null);
  };

  const handleSaveCategory = async (categoryId: string) => {
    const draft = drafts[categoryId];
    if (!draft) return;

    setSavingId(categoryId);
    const result = await updateMeetingMinuteCategory(categoryId, {
      decisionMode: draft.decisionMode,
      decisionText: draft.decisionText || null,
      ownerId: draft.ownerId === "none" ? null : draft.ownerId,
      dueDate: draft.dueDate || null,
    });

    if (result.success) {
      toast.success("Decisao salva");
      await loadData();
    } else {
      toast.error(result.error || "Erro ao salvar decisao");
    }
    setSavingId(null);
  };

  const handleCreateTaskFromCategory = async (category: Category) => {
    const draft = drafts[category.id];
    const decisionText = draft?.decisionText?.trim() || category.decision_text || "";
    if (!decisionText) {
      toast.error("Registre a decisao antes de gerar uma tarefa");
      return;
    }

    setSavingId(`task-${category.id}`);
    const result = await createMeetingTask({
      meetingMinuteId: minuteId,
      categoryId: category.id,
      title: `${category.title}: encaminhamento`,
      description: decisionText,
      ownerId:
        draft?.ownerId && draft.ownerId !== "none"
          ? draft.ownerId
          : category.owner_id || minute?.responsavel_id || null,
      dueDate: draft?.dueDate || category.due_date || null,
      source: "block_decision",
    });

    if (result.success) {
      toast.success("Tarefa criada");
      await loadData();
    } else {
      toast.error(result.error || "Erro ao criar tarefa");
    }
    setSavingId(null);
  };

  const handleUpdateTaskStatus = async (
    task: MeetingTask,
    status: MeetingTask["status"],
  ) => {
    if (task.status === status) return;

    setSavingId(`task-status-${task.id}`);
    const result = await updateMeetingTask(task.id, { status });
    if (result.success) {
      toast.success("Status da tarefa atualizado");
      await loadData();
    } else {
      toast.error(result.error || "Erro ao atualizar tarefa");
    }
    setSavingId(null);
  };

  const handleSaveSpotlight = async (item: SpotlightItem) => {
    const draft = spotlightDrafts[item.id];
    if (!draft) return;

    setSavingId(`spotlight-save-${item.id}`);
    const result = await updateSpotlightItem(item.id, {
      decisionText: draft.decisionText || null,
      ownerId: draft.ownerId === "none" ? null : draft.ownerId,
      dueDate: draft.dueDate || null,
    });

    if (result.success) {
      toast.success("Destaque atualizado");
      await loadData();
    } else {
      toast.error(result.error || "Erro ao atualizar destaque");
    }
    setSavingId(null);
  };

  const handleCreateTaskFromSpotlight = async (item: SpotlightItem) => {
    const existingTask = tasks.find((task) => task.spotlight_item_id === item.id);
    if (existingTask) {
      toast.error("Este destaque ja possui tarefa gerada");
      return;
    }

    const draft = spotlightDrafts[item.id];
    const decisionText = draft?.decisionText.trim() || item.decision_text || "";
    if (!decisionText) {
      toast.error("Registre a decisao do destaque antes de gerar a tarefa");
      return;
    }

    const taskTitleBase = item.case_number
      ? `Caso destacado ${item.case_number}`
      : `Caso destacado: ${item.reason}`;

    setSavingId(`spotlight-task-${item.id}`);
    const updateResult = await updateSpotlightItem(item.id, {
      decisionText,
      ownerId: draft?.ownerId && draft.ownerId !== "none" ? draft.ownerId : null,
      dueDate: draft?.dueDate || null,
    });

    if (!updateResult.success) {
      toast.error(updateResult.error || "Erro ao atualizar destaque");
      setSavingId(null);
      return;
    }

    const result = await createMeetingTask({
      meetingMinuteId: minuteId,
      clientId: item.client_id,
      caseId: item.case_id,
      spotlightItemId: item.id,
      title: taskTitleBase.slice(0, 240),
      description: decisionText,
      ownerId:
        draft?.ownerId && draft.ownerId !== "none"
          ? draft.ownerId
          : item.owner_id || minute?.responsavel_id || null,
      dueDate: draft?.dueDate || item.due_date || null,
      source: "spotlight_decision",
    });

    if (result.success) {
      toast.success("Tarefa criada a partir do destaque");
      await loadData();
    } else {
      toast.error(result.error || "Erro ao criar tarefa");
    }
    setSavingId(null);
  };

  const handleAddSpotlight = async () => {
    if (!spotlightReason.trim()) {
      toast.error("Informe o motivo do destaque");
      return;
    }

    setSavingId("spotlight");
    const result = await createSpotlightItem({
      meetingMinuteId: minuteId,
      clientId: spotlightClientId === "none" ? null : spotlightClientId,
      caseId: spotlightCaseId === "none" ? null : spotlightCaseId,
      reason: spotlightReason.trim(),
      ownerId: minute?.responsavel_id || null,
    });

    if (result.success) {
      toast.success("Caso destacado adicionado");
      setSpotlightClientId("none");
      setSpotlightCaseId("none");
      setSpotlightReason("");
      await loadData();
    } else {
      toast.error(result.error || "Erro ao adicionar destaque");
    }
    setSavingId(null);
  };

  const handlePublish = async () => {
    if (!confirm("Publicar e travar esta ata para edicao pelo advogado?")) return;
    setSavingId("publish");
    const result = await publishMeetingMinute(minuteId);
    if (result.success) {
      toast.success("Ata publicada");
      await loadData();
    } else {
      toast.error(result.error || "Erro ao publicar ata");
    }
    setSavingId(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando ata...
      </div>
    );
  }

  if (!minute) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="outline" onClick={() => router.push("/admin/meeting-minutes")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Card className="p-8 text-center text-muted-foreground">Ata nao encontrada.</Card>
      </div>
    );
  }

  const snapshot = minute.portfolio_snapshot_json || {};

  return (
    <div className="space-y-6 p-6">
      <AdminHeader
        title="Ata Quinzenal"
        breadcrumbs={[
          { label: "Atas", href: "/admin/meeting-minutes" },
          { label: minute.responsavel_nome },
        ]}
        subtitle={`${new Date(`${minute.meeting_date}T12:00:00`).toLocaleDateString(
          "pt-BR",
        )} - ${statusLabels[minute.status] || minute.status}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/meeting-minutes">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button
              variant="outline"
              disabled={!canEdit || savingId === "prepare"}
              onClick={handlePrepare}
            >
              {savingId === "prepare" && <Loader2 className="h-4 w-4 animate-spin" />}
              Preparar pauta
            </Button>
            <Button disabled={!canEdit || savingId === "publish"} onClick={handlePublish}>
              {savingId === "publish" && <Loader2 className="h-4 w-4 animate-spin" />}
              Publicar
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Clientes" value={snapshot.clientsCount} />
        <SummaryCard label="Processos ativos" value={snapshot.activeCasesCount} />
        <SummaryCard label="Sem movimento 60d+" value={snapshot.staleCasesCount} />
        <SummaryCard label="Sem comunicacao" value={snapshot.clientsWithoutRecentUpdateCount} />
      </div>

      {!canEdit && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Esta ata esta publicada. Advogados podem consultar, mas somente Admin e
          Controller podem editar.
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pauta por categorias</h2>
            <p className="text-sm text-muted-foreground">
              Registre decisoes em bloco. Casos fora da regra entram em destaque.
            </p>
          </div>
        </div>

        {categories.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma categoria preparada. Use Preparar pauta para gerar a triagem da
            carteira.
          </Card>
        ) : (
          <div className="grid gap-4">
            {categories.map((category) => {
              const draft = drafts[category.id];
              return (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between gap-3 text-base">
                      <span className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-brand-600" />
                        {category.title}
                      </span>
                      <span className="rounded bg-brand-50 px-2 py-1 text-xs text-brand-800">
                        {category.items_count} item(ns)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CategorySample items={category.items_json} />

                    <div className="grid gap-3 md:grid-cols-[180px_1fr_220px_160px]">
                      <div className="space-y-2">
                        <Label>Modo</Label>
                        <Select
                          value={draft?.decisionMode || category.decision_mode}
                          disabled={!canEdit}
                          onValueChange={(value) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [category.id]: {
                                ...prev[category.id],
                                decisionMode: value as Category["decision_mode"],
                                decisionText: prev[category.id]?.decisionText || "",
                                ownerId: prev[category.id]?.ownerId || "none",
                                dueDate: prev[category.id]?.dueDate || "",
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(decisionModeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Decisao tomada</Label>
                        <Textarea
                          value={draft?.decisionText || ""}
                          disabled={!canEdit}
                          placeholder="Ex: enviar comunicacao padrao aos clientes e revisar casos sem resposta em 7 dias"
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [category.id]: {
                                decisionMode:
                                  prev[category.id]?.decisionMode || category.decision_mode,
                                decisionText: event.target.value,
                                ownerId: prev[category.id]?.ownerId || "none",
                                dueDate: prev[category.id]?.dueDate || "",
                              },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Responsavel</Label>
                        <Select
                          value={draft?.ownerId || "none"}
                          disabled={!canEdit}
                          onValueChange={(value) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [category.id]: {
                                decisionMode:
                                  prev[category.id]?.decisionMode || category.decision_mode,
                                decisionText: prev[category.id]?.decisionText || "",
                                ownerId: value,
                                dueDate: prev[category.id]?.dueDate || "",
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem responsavel</SelectItem>
                            {ownerOptions.map((owner) => (
                              <SelectItem key={owner.id} value={owner.id}>
                                {owner.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Prazo</Label>
                        <Input
                          type="date"
                          value={draft?.dueDate || ""}
                          disabled={!canEdit}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [category.id]: {
                                decisionMode:
                                  prev[category.id]?.decisionMode || category.decision_mode,
                                decisionText: prev[category.id]?.decisionText || "",
                                ownerId: prev[category.id]?.ownerId || "none",
                                dueDate: event.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        disabled={!canEdit || savingId === category.id}
                        onClick={() => handleSaveCategory(category.id)}
                      >
                        {savingId === category.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Salvar decisao
                      </Button>
                      <Button
                        disabled={!canEdit || savingId === `task-${category.id}`}
                        onClick={() => handleCreateTaskFromCategory(category)}
                      >
                        {savingId === `task-${category.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Gerar tarefa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Casos destacados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {spotlights.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum caso destacado para analise pormenorizada.
              </p>
            ) : (
              <div className="space-y-3">
                {spotlights.map((item) => {
                  const hasTask = tasks.some((task) => task.spotlight_item_id === item.id);
                  const draft = spotlightDrafts[item.id];
                  return (
                    <div key={item.id} className="rounded border p-3 text-sm">
                      {(item.client_name || item.case_number) && (
                        <p className="mb-1 text-xs font-medium text-brand-700">
                          {[item.client_name, item.case_number]
                            .filter(Boolean)
                            .join(" - ")}
                        </p>
                      )}
                      <p className="font-medium">{item.reason}</p>
                      {item.case_description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.case_description}
                        </p>
                      )}
                      <div className="mt-3 space-y-3">
                        <div className="space-y-2">
                          <Label>Decisao e encaminhamento</Label>
                          <Textarea
                            value={draft?.decisionText || ""}
                            disabled={!canEdit}
                            placeholder="Ex: priorizar analise individual, validar risco e retornar com proposta de acordo"
                            onChange={(event) =>
                              setSpotlightDrafts((prev) => ({
                                ...prev,
                                [item.id]: {
                                  decisionText: event.target.value,
                                  ownerId: prev[item.id]?.ownerId || item.owner_id || "none",
                                  dueDate: prev[item.id]?.dueDate || item.due_date || "",
                                },
                              }))
                            }
                          />
                        </div>

                        <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                          <div className="space-y-2">
                            <Label>Responsavel</Label>
                            <Select
                              value={draft?.ownerId || item.owner_id || "none"}
                              disabled={!canEdit}
                              onValueChange={(value) =>
                                setSpotlightDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    decisionText:
                                      prev[item.id]?.decisionText ||
                                      item.decision_text ||
                                      "",
                                    ownerId: value,
                                    dueDate: prev[item.id]?.dueDate || item.due_date || "",
                                  },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem responsavel</SelectItem>
                                {ownerOptions.map((owner) => (
                                  <SelectItem key={owner.id} value={owner.id}>
                                    {owner.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Prazo</Label>
                            <Input
                              type="date"
                              value={draft?.dueDate || ""}
                              disabled={!canEdit}
                              onChange={(event) =>
                                setSpotlightDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    decisionText:
                                      prev[item.id]?.decisionText ||
                                      item.decision_text ||
                                      "",
                                    ownerId: prev[item.id]?.ownerId || item.owner_id || "none",
                                    dueDate: event.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            !canEdit ||
                            savingId === `spotlight-save-${item.id}` ||
                            savingId === `spotlight-task-${item.id}`
                          }
                          onClick={() => handleSaveSpotlight(item)}
                        >
                          {savingId === `spotlight-save-${item.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Salvar destaque
                        </Button>
                        <Button
                          size="sm"
                          variant={hasTask ? "outline" : "default"}
                          disabled={
                            !canEdit ||
                            hasTask ||
                            savingId === `spotlight-task-${item.id}`
                          }
                          onClick={() => handleCreateTaskFromSpotlight(item)}
                        >
                          {savingId === `spotlight-task-${item.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : hasTask ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          {hasTask ? "Tarefa criada" : "Gerar tarefa"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2 border-t pt-4">
              <Label>Novo destaque</Label>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select
                    value={spotlightClientId}
                    disabled={!canEdit}
                    onValueChange={(value) => {
                      setSpotlightClientId(value);
                      setSpotlightCaseId("none");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem cliente especifico</SelectItem>
                      {spotlightClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.razao_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Processo</Label>
                  <Select
                    value={spotlightCaseId}
                    disabled={!canEdit}
                    onValueChange={(value) => {
                      setSpotlightCaseId(value);
                      if (value !== "none") {
                        const selectedCase = spotlightCases.find(
                          (caseItem) => caseItem.id === value,
                        );
                        if (selectedCase) setSpotlightClientId(selectedCase.client_id);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um processo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem processo especifico</SelectItem>
                      {filteredSpotlightCases.map((caseItem) => (
                        <SelectItem key={caseItem.id} value={caseItem.id}>
                          {caseItem.numero_processo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea
                value={spotlightReason}
                disabled={!canEdit}
                placeholder="Ex: processo X exige decisao individual por risco alto"
                onChange={(event) => setSpotlightReason(event.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  disabled={!canEdit || savingId === "spotlight"}
                  onClick={handleAddSpotlight}
                >
                  {savingId === "spotlight" && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Adicionar destaque
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarefas geradas</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa gerada a partir desta ata.
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="grid gap-3 rounded border p-3 text-sm md:grid-cols-[1fr_150px]"
                  >
                    <div>
                      {(task.client_name || task.case_number) && (
                        <p className="mb-1 text-xs font-medium text-brand-700">
                          {[task.client_name, task.case_number]
                            .filter(Boolean)
                            .join(" - ")}
                        </p>
                      )}
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Origem: {taskSourceLabels[task.source] || task.source}
                        {task.due_date ? ` - Prazo: ${task.due_date}` : ""}
                        {task.owner_name ? ` - Responsavel: ${task.owner_name}` : ""}
                      </p>
                    </div>
                    <div className="flex items-start justify-end">
                      <Select
                        value={task.status}
                        disabled={!canEdit || savingId === `task-status-${task.id}`}
                        onValueChange={(value) =>
                          handleUpdateTaskStatus(task, value as MeetingTask["status"])
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(taskStatusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: unknown }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{String(value ?? 0)}</p>
      </CardContent>
    </Card>
  );
}

function CategorySample({ items }: { items: Array<Record<string, unknown>> }) {
  if (!items || items.length === 0) {
    return (
      <p className="rounded bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Nenhum item nesta categoria no snapshot atual.
      </p>
    );
  }

  return (
    <div className="rounded border bg-muted/20 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Amostra de itens ({Math.min(items.length, 5)} de {items.length})
      </p>
      <div className="space-y-1 text-xs text-muted-foreground">
        {items.slice(0, 5).map((item, idx) => (
          <div key={idx} className="truncate">
            {String(
              item.numeroProcesso ||
                item.razaoSocial ||
                item.taskId ||
                item.clientId ||
                "Item",
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
