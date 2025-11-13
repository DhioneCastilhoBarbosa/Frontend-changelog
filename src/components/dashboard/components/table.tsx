import React, { useEffect, useMemo, useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Inbox } from "lucide-react";
import api from "../../../services/api";
import { toast } from "sonner";

type ReleaseLink = {
  id: number;
  module: string;
  description: string;
  url: string;
};
type ReleaseModule = {
  id: number;
  module: string;
  version: string;
  updated: boolean;
};
type ReleaseEntry = {
  id: number;
  itemOrder: number;
  classification: string;
  category?: string;
  observation: string;
};
type Release = {
  id: number;
  version: string;
  previousVersion: string;
  ota: boolean;
  otaObs?: string;
  releaseDate: string;
  importantNote?: string;
  productCategory: string;
  productName: string;
  status: "revisao" | "producao" | "descontinuado" | string;
  modules: ReleaseModule[] | undefined | null;
  entries: ReleaseEntry[] | undefined | null;
  links: ReleaseLink[] | undefined | null;
  createdAt: string;
  updatedAt: string;
};

type ModalMode = "add" | "edit";
type ModalType = "release" | "module" | "entry" | "link";
type ModalState =
  | {
      open: true;
      type: ModalType;
      mode: ModalMode;
      release: Release;
      data:
        | Partial<Release>
        | Partial<ReleaseModule>
        | Partial<ReleaseEntry>
        | Partial<ReleaseLink>;
    }
  | { open: false };

type ConfirmState =
  | {
      open: true;
      title: string;
      message: string;
      onConfirm: () => Promise<void>;
      busy?: boolean;
    }
  | { open: false };

type LinkDraft = Partial<ReleaseLink> & {
  _file?: File | null;
  _dir?: string | null;
};

export default function ReleaseTable() {
  const [data, setData] = useState<Release[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | Release["status"]>(
    "Todos"
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });
  const [saving, setSaving] = useState(false);

  const perPage = 10;

  const normalize = (r: Release): Release => ({
    ...r,
    modules: Array.isArray(r.modules) ? r.modules : [],
    entries: Array.isArray(r.entries) ? r.entries : [],
    links: Array.isArray((r as any).links) ? (r as any).links : [],
  });

  const getData = useCallback(async () => {
    const res = await api.get("/releases");
    const list = (res.data as Release[]).map(normalize);
    setData(list);
  }, []);
  useEffect(() => {
    getData();
  }, [getData]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return data.filter((r) => {
      const matchesSearch =
        !s ||
        r.version.toLowerCase().includes(s) ||
        r.productName.toLowerCase().includes(s) ||
        r.productCategory.toLowerCase().includes(s);
      const matchesStatus =
        statusFilter === "Todos"
          ? true
          : r.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

  const statusPill = (status: Release["status"]) => {
    const s = String(status ?? "").toLowerCase();
    const base =
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    if (s === "producao")
      return `${base} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`;
    if (s === "revisao")
      return `${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300`;
    if (s === "descontinuado")
      return `${base} bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300`;
    return `${base} bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300`;
  };

  const labelStatus = (status: Release["status"]) => {
    const s = String(status ?? "").toLowerCase();
    if (s === "producao") return "Produção";
    if (s === "revisao") return "Revisão";
    if (s === "descontinuado") return "Descontinuado";
    return String(status ?? "");
  };

  const openLinkAdd = (r: Release) =>
    setModal({
      open: true,
      type: "link",
      mode: "add",
      release: normalize(r),
      data: {
        module: "",
        description: "",
        url: "",
        _file: null,
        _dir: "",
      } as LinkDraft,
    });

  const openLinkEdit = (r: Release, l: ReleaseLink) =>
    setModal({
      open: true,
      type: "link",
      mode: "edit",
      release: normalize(r),
      data: {
        id: l.id,
        module: l.module,
        description: l.description,
        url: l.url,
        _file: null,
        _dir: "",
      } as LinkDraft,
    });

  const openReleaseEdit = (r: Release) =>
    setModal({
      open: true,
      type: "release",
      mode: "edit",
      release: normalize(r),
      data: {
        version: r.version,
        previousVersion: r.previousVersion,
        ota: r.ota,
        otaObs: r.otaObs ?? "",
        releaseDate: r.releaseDate?.slice(0, 10),
        importantNote: r.importantNote ?? "",
        productCategory: r.productCategory,
        productName: r.productName,
        status: r.status,
      },
    });

  const openModuleAdd = (r: Release) =>
    setModal({
      open: true,
      type: "module",
      mode: "add",
      release: normalize(r),
      data: { module: "", version: "", updated: false },
    });

  const openModuleEdit = (r: Release, m: ReleaseModule) =>
    setModal({
      open: true,
      type: "module",
      mode: "edit",
      release: normalize(r),
      data: {
        id: m.id,
        module: m.module,
        version: m.version,
        updated: m.updated,
      },
    });

  const openEntryAdd = (r: Release) =>
    setModal({
      open: true,
      type: "entry",
      mode: "add",
      release: normalize(r),
      data: {
        itemOrder: ((r.entries ?? []).length || 0) + 1,
        classification: "",
        category: "",
        observation: "",
      },
    });

  const openEntryEdit = (r: Release, e: ReleaseEntry) =>
    setModal({
      open: true,
      type: "entry",
      mode: "edit",
      release: normalize(r),
      data: {
        id: e.id,
        itemOrder: e.itemOrder,
        classification: e.classification,
        category: e.category ?? "",
        observation: e.observation,
      },
    });

  const closeModal = () => setModal({ open: false });

  const sanitize = <T extends object>(obj: T) => {
    const { id, createdAt, updatedAt, ...rest } = obj as any;
    return rest as T;
  };

  function toApiDate(v?: string) {
    if (!v) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v))
      return new Date(`${v}T00:00:00Z`).toISOString();
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  async function fetchReleaseById(id: number): Promise<Release> {
    const res = await api.get(`/releases/${id}`);
    return normalize(res.data as Release);
  }

  function buildReleaseUpdatePayload(base: Release, updates: Partial<Release>) {
    const releaseDateISO =
      toApiDate(updates.releaseDate ?? base.releaseDate) ?? base.releaseDate;
    const payload = {
      version: updates.version ?? base.version,
      previousVersion: updates.previousVersion ?? base.previousVersion,
      ota: typeof updates.ota === "boolean" ? updates.ota : base.ota,
      otaObs: (updates.otaObs ?? base.otaObs) || "",
      releaseDate: releaseDateISO,
      importantNote: (updates.importantNote ?? base.importantNote) || "",
      productCategory: updates.productCategory ?? base.productCategory,
      productName: updates.productName ?? base.productName,
      status: updates.status ?? base.status,
      modules: (base.modules || []).map((m) => ({
        module: m.module,
        version: m.version,
        updated: m.updated,
      })),
      entries: (base.entries || []).map((e) => ({
        itemOrder: e.itemOrder,
        classification: e.classification,
        observation: e.observation,
      })),
      links: (base.links || []).map((l) => ({
        module: l.module,
        description: l.description,
        url: l.url,
      })),
    };
    return sanitize(payload);
  }

  function confirmDelete(
    title: string,
    message: string,
    action: () => Promise<void>
  ) {
    setConfirm({ open: true, title, message, onConfirm: action, busy: false });
  }
  async function doConfirmedDelete() {
    if (!confirm.open) return;
    setConfirm((prev) => ({ ...(prev as any), busy: true }));
    try {
      await confirm.onConfirm();
      await getData();
    } finally {
      setConfirm({ open: false } as any);
    }
  }
  function sameLink(a: ReleaseLink, b: Partial<ReleaseLink>) {
    if (a.id && b.id) return a.id === b.id;
    return (
      a.module === b.module &&
      a.description === b.description &&
      a.url === b.url
    );
  }

  const askDeleteLink = (r: Release, l: ReleaseLink) =>
    confirmDelete(
      "Excluir Firmware",
      `Confirma excluir o link "${l.description}" da release #${r.id}?`,
      async () => {
        await putReleaseWith(r.id, (fresh) => ({
          ...fresh,
          links: (fresh.links ?? []).filter((x) => !sameLink(x, l)),
        }));
      }
    );

  const askDeleteRelease = (r: Release) =>
    confirmDelete(
      "Excluir Release",
      `Confirma excluir a release #${r.id} (${r.version})? Esta ação é irreversível.`,
      async () => {
        await api.delete(`/releases/${r.id}`);
      }
    );

  const askDeleteModule = (r: Release, m: ReleaseModule) =>
    confirmDelete(
      "Excluir Módulo",
      `Confirma excluir o módulo "${m.module}" da release #${r.id}?`,
      async () => {
        await putReleaseWith(r.id, (fresh) => ({
          ...fresh,
          modules: (fresh.modules ?? []).filter((x) => x.id !== m.id),
        }));
      }
    );

  const askDeleteEntry = (r: Release, e: ReleaseEntry) =>
    confirmDelete(
      "Excluir Registro",
      `Confirma excluir o registro #${e.itemOrder} da release #${r.id}?`,
      async () => {
        await putReleaseWith(r.id, (fresh) => {
          const ents = (fresh.entries ?? []).filter((x) => x.id !== e.id);
          const reindexed = ents.map((x, i) => ({ ...x, itemOrder: i + 1 }));
          return { ...fresh, entries: reindexed };
        });
      }
    );

  async function putReleaseWith(
    releaseId: number,
    transform: (fresh: Release) => Release
  ) {
    const fresh = await fetchReleaseById(releaseId);
    const next = transform(fresh);
    const payload = buildReleaseUpdatePayload(next, {} as Partial<Release>);
    await api.put(`/releases/${releaseId}`, payload);
  }

  async function saveLink() {
    if (!modal.open || modal.type !== "link") return;
    setSaving(true);
    try {
      const rId = modal.release.id;
      const draft = modal.data as LinkDraft;

      // Validação quando NÃO há arquivo (URL obrigatória)
      const isUrl = (u?: string) => !!u && /^https?:\/\/\S+/i.test(u);
      if (!draft._file) {
        if (
          modal.mode === "add" &&
          (!draft.module || !draft.description || !isUrl(draft.url))
        ) {
          toast.error(
            "Preencha Módulo, Descrição e uma URL válida (http/https)."
          );
          setSaving(false);
          return;
        }
        // fluxo JSON puro (igual ao seu)
        await putReleaseWith(rId, (fresh) => {
          const links = [...(fresh.links ?? [])];
          if (modal.mode === "add") {
            links.push({
              id: 0 as any,
              module: draft.module ?? "",
              description: draft.description ?? "",
              url: draft.url ?? "",
            });
          } else {
            for (let i = 0; i < links.length; i++) {
              if (links[i].id === draft.id) {
                links[i] = {
                  ...links[i],
                  module: draft.module ?? links[i].module,
                  description: draft.description ?? links[i].description,
                  url: draft.url ?? links[i].url,
                };
                break;
              }
            }
          }
          return { ...fresh, links };
        });
        await getData();
        closeModal();
        return;
      }

      // === Fluxo MULTIPART (com arquivo) ===
      const fresh = await fetchReleaseById(rId);

      // 1) JSON para o backend: removemos o link sendo editado (se "edit"),
      //    ou mantemos como está (se "add" sem URL) para o upload criar o novo link.
      const nextJsonBase: Release = (() => {
        if (modal.mode === "edit") {
          return {
            ...fresh,
            links: (fresh.links ?? []).filter((x) => x.id !== draft.id),
          };
        } else {
          // add: não incluímos o novo link no JSON; ele virá do upload
          return fresh;
        }
      })();

      // 2) Monta o upload
      const upload = {
        file: draft._file!,
        module: (draft.module || "").trim() || "default",
        description: (draft.description || "").trim() || "Firmware",
      };

      // 3) Diretório (use o que você já usa no Postman; pode vir de UI)
      let dir = (draft._dir || "").trim();

      if (!dir || modal.mode === "edit") {
        const category = (modal.release.productCategory || "").trim();
        const name = (modal.release.productName || "").trim();
        dir = `${category}/${name}`;
      }
      await putReleaseMultipart(rId, nextJsonBase, [upload], dir);

      await getData();
      closeModal();
    } catch (err: any) {
      console.error(
        "PUT multipart /releases error:",
        err?.response?.status,
        err?.response?.data
      );
      toast.error(err?.response?.data?.error || "Falha ao enviar arquivo.");
    } finally {
      setSaving(false);
    }
  }

  async function saveRelease() {
    if (!modal.open || modal.type !== "release") return;
    setSaving(true);
    try {
      const fresh = await fetchReleaseById(modal.release.id);
      const payload = buildReleaseUpdatePayload(
        fresh,
        modal.data as Partial<Release>
      );
      await api.put(`/releases/${modal.release.id}`, payload);
      await getData();
      closeModal();
    } catch (err: any) {
      console.error(
        "PUT /releases error:",
        err?.response?.status,
        err?.response?.data
      );
      toast.error(err?.response?.data?.message || "Falha ao salvar release.");
    } finally {
      setSaving(false);
    }
  }

  async function saveModule() {
    if (!modal.open || modal.type !== "module") return;
    setSaving(true);
    try {
      const rId = modal.release.id;
      const d = modal.data as Partial<ReleaseModule>;
      await putReleaseWith(rId, (fresh) => {
        const mods = [...(fresh.modules ?? [])];
        if (modal.mode === "add") {
          mods.push({
            id: 0 as any,
            module: d.module ?? "",
            version: d.version ?? "",
            updated: !!d.updated,
          });
        } else {
          for (let i = 0; i < mods.length; i++) {
            if (mods[i].id === d.id) {
              mods[i] = {
                ...mods[i],
                module: d.module ?? mods[i].module,
                version: d.version ?? mods[i].version,
                updated:
                  typeof d.updated === "boolean" ? d.updated : mods[i].updated,
              };
              break;
            }
          }
        }
        return { ...fresh, modules: mods };
      });
      await getData();
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function saveEntry() {
    if (!modal.open || modal.type !== "entry") return;
    setSaving(true);
    try {
      const rId = modal.release.id;
      const d = modal.data as Partial<ReleaseEntry>;
      await putReleaseWith(rId, (fresh) => {
        const ents = [...(fresh.entries ?? [])];
        if (modal.mode === "add") {
          ents.push({
            id: 0 as any,
            itemOrder: d.itemOrder ?? ents.length + 1,
            classification: d.classification ?? "",
            observation: d.observation ?? "",
          });
        } else {
          for (let i = 0; i < ents.length; i++) {
            if (ents[i].id === d.id) {
              ents[i] = {
                ...ents[i],
                itemOrder:
                  typeof d.itemOrder === "number"
                    ? d.itemOrder
                    : ents[i].itemOrder,
                classification: d.classification ?? ents[i].classification,
                observation: d.observation ?? ents[i].observation,
              };
              break;
            }
          }
        }
        return { ...fresh, entries: ents };
      });
      await getData();
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="rounded-xl shadow-lg ring-1 ring-slate-200 dark:ring-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="w-full md:w-1/2 px-3 py-2 rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
            placeholder="Buscar por versão, produto ou categoria"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as any);
            }}
            className="w-full md:w-64 px-3 py-2 rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
          >
            <option value="Todos">Todos os status</option>
            <option value="producao">Produção</option>
            <option value="revisao">Revisão</option>
            <option value="descontinuado">Descontinuado</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-xl shadow-lg ring-1 ring-slate-200 dark:ring-zinc-700">
        {/* ADIÇÃO: scroller responsivo sem alterar botões */}
        <div
          className="overflow-x-auto md:overflow-visible"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700 text-sm">
            <thead className="bg-gray-100 dark:bg-zinc-800">
              <tr className="whitespace-nowrap">
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Versão</th>
                <th className="px-4 py-3 text-left font-semibold">Categoria</th>
                <th className="px-4 py-3 text-left font-semibold">Produto</th>
                <th className="px-4 py-3 text-left font-semibold">Criado em</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Detalhes</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
              {pageData.map((r) => {
                const expanded = expandedId === r.id;
                const mods = r.modules ?? [];
                const ents = r.entries ?? [];
                return (
                  <React.Fragment key={r.id}>
                    <tr className="align-top">
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3">{r.version}</td>
                      <td className="px-4 py-3">{r.productCategory}</td>
                      <td className="px-4 py-3">{r.productName}</td>
                      <td className="px-4 py-3">{fmtDate(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={statusPill(r.status)}>
                          {labelStatus(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(expanded ? null : r.id)}
                          className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md border dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                          aria-expanded={expanded}
                          aria-controls={`release-details-${r.id}`}
                        >
                          <span className="text-xs">
                            {expanded ? "Recolher" : "Expandir"}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              expanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </td>
                    </tr>

                    {expanded && (
                      <tr>
                        <td
                          colSpan={7}
                          id={`release-details-${r.id}`}
                          className="px-0 pb-4"
                        >
                          {/* ADIÇÃO: largura mínima p/ conteúdo expandido dentro do scroller */}
                          <div className="mt-2 mb-3 px-4 min-w-[720px] md:min-w-0">
                            <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4 bg-gray-50 dark:bg-zinc-800">
                              <div className="space-y-6">
                                <section>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">Resumo</h4>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => openReleaseEdit(r)}
                                        className="px-2 py-1 rounded-md border dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs"
                                      >
                                        Editar Release
                                      </button>
                                      <button
                                        onClick={() => askDeleteRelease(r)}
                                        className="px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 text-xs"
                                      >
                                        Excluir Release
                                      </button>
                                    </div>
                                  </div>
                                  <ul className="text-sm list-disc pl-5 space-y-1">
                                    <li>Produto: {r.productName}</li>
                                    <li>Categoria: {r.productCategory}</li>
                                    <li>Status: {labelStatus(r.status)}</li>
                                    <li>
                                      Data de Cadastro: {fmtDate(r.createdAt)}
                                    </li>
                                  </ul>
                                  <ul className="text-sm list-disc pl-5 space-y-1">
                                    <li>
                                      Versão anterior:{" "}
                                      {r.previousVersion || "-"}
                                    </li>
                                    <li>
                                      Atualização via OTA:{" "}
                                      {r.ota ? "sim" : "não"}
                                    </li>
                                    {r.otaObs && (
                                      <li>
                                        Observação para atualização: {r.otaObs}
                                      </li>
                                    )}
                                    <li>
                                      Data da Release: {fmtDate(r.releaseDate)}
                                    </li>
                                    {r.importantNote && (
                                      <li>Nota: {r.importantNote}</li>
                                    )}
                                  </ul>
                                </section>

                                <section>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">Módulos</h4>
                                    <button
                                      onClick={() => openModuleAdd(r)}
                                      className="px-2 py-1 rounded-md border dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs"
                                    >
                                      Adicionar Módulo
                                    </button>
                                  </div>
                                  {(mods.length ?? 0) === 0 ? (
                                    <p className="text-sm text-gray-500">
                                      Sem módulos
                                    </p>
                                  ) : (
                                    <div
                                      className="overflow-x-auto"
                                      style={{
                                        WebkitOverflowScrolling: "touch",
                                      }}
                                    >
                                      <table className="w-full text-sm border border-gray-200 dark:border-zinc-700 rounded-md overflow-hidden min-w-[560px]">
                                        <thead className="bg-gray-100 dark:bg-zinc-900">
                                          <tr className="whitespace-nowrap">
                                            <th className="px-3 py-2 text-left">
                                              Módulo
                                            </th>
                                            <th className="px-3 py-2 text-left">
                                              Versão
                                            </th>
                                            <th className="px-3 py-2 text-left">
                                              Atualizado
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                              Ações
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(mods ?? []).map((m) => (
                                            <tr
                                              key={m.id}
                                              className="border-t border-gray-200 dark:border-zinc-700"
                                            >
                                              <td className="px-3 py-2">
                                                {m.module}
                                              </td>
                                              <td className="px-3 py-2">
                                                {m.version}
                                              </td>
                                              <td className="px-3 py-2">
                                                {m.updated ? "sim" : "não"}
                                              </td>
                                              <td className="px-3 py-2 text-right space-x-2">
                                                <button
                                                  onClick={() =>
                                                    openModuleEdit(r, m)
                                                  }
                                                  className="px-2 py-1 rounded-md border dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs"
                                                >
                                                  Editar
                                                </button>
                                                <button
                                                  onClick={() =>
                                                    askDeleteModule(r, m)
                                                  }
                                                  className="px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 text-xs"
                                                >
                                                  Excluir
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </section>

                                <section>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">Registros</h4>
                                    <button
                                      onClick={() => openEntryAdd(r)}
                                      className="px-2 py-1 rounded-md border dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs"
                                    >
                                      Adicionar Registro
                                    </button>
                                  </div>
                                  {(ents.length ?? 0) === 0 ? (
                                    <p className="text-sm text-gray-500">
                                      Sem registros
                                    </p>
                                  ) : (
                                    <ul className="space-y-2 text-sm">
                                      {(ents ?? []).map((e) => (
                                        <li
                                          key={e.id}
                                          className="p-2 rounded-md border border-gray-200 dark:border-zinc-700"
                                        >
                                          <div className="flex justify-between mb-1">
                                            <span className="font-medium">
                                              #{e.itemOrder} •{" "}
                                              {e.classification}
                                            </span>
                                            <div className="flex items-center gap-2">
                                              {e.category && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-700">
                                                  {e.category}
                                                </span>
                                              )}
                                              <button
                                                onClick={() =>
                                                  openEntryEdit(r, e)
                                                }
                                                className="px-2 py-1 rounded-md border dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs"
                                              >
                                                Editar
                                              </button>
                                              <button
                                                onClick={() =>
                                                  askDeleteEntry(r, e)
                                                }
                                                className="px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 text-xs"
                                              >
                                                Excluir
                                              </button>
                                            </div>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">
                                            {e.observation}
                                          </p>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </section>

                                <section>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">Firmwares</h4>
                                    <button
                                      onClick={() => openLinkAdd(r)}
                                      className="px-2 py-1 rounded-md border dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs"
                                    >
                                      Adicionar Firmware
                                    </button>
                                  </div>

                                  {!r.links || r.links.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                      Sem firmwares
                                    </p>
                                  ) : (
                                    <div
                                      className="overflow-x-auto"
                                      style={{
                                        WebkitOverflowScrolling: "touch",
                                      }}
                                    >
                                      <table className="w-full text-sm border border-gray-200 dark:border-zinc-700 rounded-md overflow-hidden min-w-[640px]">
                                        <thead className="bg-gray-100 dark:bg-zinc-900">
                                          <tr className="whitespace-nowrap">
                                            <th className="px-3 py-2 text-left">
                                              Módulo
                                            </th>
                                            <th className="px-3 py-2 text-left">
                                              Descrição
                                            </th>
                                            <th className="px-3 py-2 text-left">
                                              URL
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                              Ações
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(r.links ?? []).map((l) => (
                                            <tr
                                              key={l.id}
                                              className="border-t border-gray-200 dark:border-zinc-700"
                                            >
                                              <td className="px-3 py-2">
                                                {l.module}
                                              </td>
                                              <td className="px-3 py-2">
                                                {l.description}
                                              </td>
                                              <td className="px-3 py-2">
                                                <a
                                                  href={l.url}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="text-blue-600 hover:underline break-all"
                                                >
                                                  {l.url}
                                                </a>
                                              </td>
                                              <td className="px-3 py-2 text-right space-x-2">
                                                <button
                                                  onClick={() =>
                                                    openLinkEdit(r, l)
                                                  }
                                                  className="px-2 py-1 rounded-md border dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs"
                                                >
                                                  Editar
                                                </button>
                                                <button
                                                  onClick={() =>
                                                    askDeleteLink(r, l)
                                                  }
                                                  className="px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 text-xs"
                                                >
                                                  Excluir
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </section>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <Inbox
                      className="w-16 h-16 mx-auto mb-2 text-gray-400 dark:text-gray-500"
                      strokeWidth={1}
                    />
                    Nenhum resultado encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {filtered.length > 0 && (
          <div className="flex justify-center items-center gap-2 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-md border dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-800 disabled:opacity-50"
            >
              &lt;
            </button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-md border dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-800 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Portais dos modais */}
      <EditModalPortal
        modal={modal}
        setModal={setModal}
        saving={saving}
        onClose={closeModal}
        saveRelease={saveRelease}
        saveModule={saveModule}
        saveEntry={saveEntry}
        saveLink={saveLink}
        askDeleteLink={askDeleteLink}
        askDeleteRelease={askDeleteRelease}
        askDeleteModule={askDeleteModule}
        askDeleteEntry={askDeleteEntry}
      />
      <ConfirmPortal
        confirm={confirm}
        setConfirm={setConfirm}
        doConfirmedDelete={doConfirmedDelete}
      />
    </div>
  );
}

/** ===== Modais em Portal ===== */

type EditModalProps = {
  modal: ModalState;
  setModal: React.Dispatch<React.SetStateAction<ModalState>>;
  saving: boolean;
  onClose: () => void;
  saveRelease: () => Promise<void>;
  saveModule: () => Promise<void>;
  saveEntry: () => Promise<void>;
  saveLink: () => Promise<void>;
  askDeleteLink: (r: Release, l: ReleaseLink) => void;
  askDeleteRelease: (r: Release) => void;
  askDeleteModule: (r: Release, m: ReleaseModule) => void;
  askDeleteEntry: (r: Release, e: ReleaseEntry) => void;
};

const EditModal = memo(function EditModal({
  modal,
  setModal,
  saving,
  onClose,
  saveRelease,
  saveModule,
  saveEntry,
  saveLink,
  askDeleteRelease,
  askDeleteModule,
  askDeleteEntry,
  askDeleteLink,
}: EditModalProps) {
  if (!modal.open) return null;
  const common =
    "w-full px-3 py-2 rounded-md border border-gray-300 text-sm bg-white dark:bg-white text-gray-900 dark:text-gray-900 placeholder:text-gray-500";
  const setField = (patch: Record<string, any>) =>
    setModal((prev) => ({
      ...(prev as any),
      data: { ...((prev as any).data || {}), ...patch },
    }));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-xl rounded-xl border border-gray-200 bg-white dark:bg-white text-gray-900 dark:text-gray-900 p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-lg font-semibold">
            {modal.type === "release" &&
              (modal.mode === "edit" ? "Editar Release" : "Adicionar Release")}
            {modal.type === "module" &&
              (modal.mode === "edit" ? "Editar Módulo" : "Adicionar Módulo")}
            {modal.type === "entry" &&
              (modal.mode === "edit"
                ? "Editar Registro"
                : "Adicionar Registro")}
            {modal.type === "link" &&
              (modal.mode === "edit"
                ? "Editar Firmware"
                : "Adicionar Firmware")}{" "}
          </h3>
          <p className="text-xs text-gray-500">
            ID Release: {modal.release.id}
          </p>
        </div>

        {/* ...todo resto inalterado... */}
        {/* Mantive exatamente seu conteúdo abaixo, sem mexer em tamanhos */}
        {/* RELEASE */}
        {modal.type === "release" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1">Versão</label>
                <input
                  className={common}
                  value={(modal.data as any).version ?? ""}
                  onChange={(e) => setField({ version: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs block mb-1">Versão anterior</label>
                <input
                  className={common}
                  value={(modal.data as any).previousVersion ?? ""}
                  onChange={(e) =>
                    setField({ previousVersion: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs block mb-1">Produto</label>
                <input
                  className={common}
                  value={(modal.data as any).productName ?? ""}
                  onChange={(e) => setField({ productName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs block mb-1">Categoria</label>
                <select
                  className={common}
                  value={(modal.data as any).productCategory ?? ""}
                  onChange={(e) =>
                    setField({ productCategory: e.target.value })
                  }
                >
                  <option value="">Selecione...</option>
                  <option value="AC">AC</option>
                  <option value="DC">DC</option>
                </select>
              </div>
              <div>
                <label className="text-xs block mb-1">Status</label>
                <select
                  className={common}
                  value={(modal.data as any).status ?? "revisao"}
                  onChange={(e) => setField({ status: e.target.value })}
                >
                  <option value="producao">Produção</option>
                  <option value="revisao">Revisão</option>
                  <option value="descontinuado">Descontinuado</option>
                </select>
              </div>
              <div>
                <label className="text-xs block mb-1">Data da Release</label>
                <input
                  type="date"
                  className={common}
                  value={(modal.data as any).releaseDate ?? ""}
                  onChange={(e) => setField({ releaseDate: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs block mb-1">Nota</label>
                <textarea
                  className={common}
                  value={(modal.data as any).importantNote ?? ""}
                  onChange={(e) => setField({ importantNote: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!(modal.data as any).ota}
                    onChange={(e) => setField({ ota: e.target.checked })}
                  />
                  Atualizável via OTA?
                </label>
                <input
                  className={common}
                  placeholder="Obs OTA"
                  value={(modal.data as any).otaObs ?? ""}
                  onChange={(e) => setField({ otaObs: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* MODULE */}
        {modal.type === "module" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs block mb-1">Módulo</label>
              <input
                className={common}
                value={(modal.data as any).module ?? ""}
                onChange={(e) => setField({ module: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1">Versão</label>
                <input
                  className={common}
                  value={(modal.data as any).version ?? ""}
                  onChange={(e) => setField({ version: e.target.value })}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm mt-6">
                <input
                  type="checkbox"
                  checked={!!(modal.data as any).updated}
                  onChange={(e) => setField({ updated: e.target.checked })}
                />
                Atualizado
              </label>
            </div>
          </div>
        )}

        {/* ENTRY */}
        {modal.type === "entry" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs block mb-1">Ordem</label>
                <input
                  type="number"
                  className={common}
                  value={(modal.data as any).itemOrder ?? 1}
                  onChange={(e) =>
                    setField({ itemOrder: Number(e.target.value) })
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs block mb-1">Classificação</label>
                <input
                  className={common}
                  value={(modal.data as any).classification ?? ""}
                  onChange={(e) => setField({ classification: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs block mb-1">Observação</label>
                <textarea
                  className={common}
                  rows={3}
                  value={(modal.data as any).observation ?? ""}
                  onChange={(e) => setField({ observation: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* LINK */}
        {modal.type === "link" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs block mb-1">Módulo</label>
              <input
                className={common}
                value={(modal.data as any).module ?? ""}
                onChange={(e) => setField({ module: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs block mb-1">Descrição</label>
              <textarea
                className={common}
                rows={3}
                placeholder="Descreva o firmware"
                value={(modal.data as any).description ?? ""}
                onChange={(e) => setField({ description: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs block mb-1">URL</label>
              <input
                className={common}
                value={(modal.data as any).url ?? ""}
                onChange={(e) => setField({ url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            {/* SELEÇÃO DE ARQUIVO */}
            <div>
              <label className="text-xs block mb-1">
                Arquivo (opcional, substitui a URL)
              </label>

              <div className="flex items-center gap-3">
                {/* Botão estilizado que dispara o input real */}
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("fileInputHidden")?.click()
                  }
                  className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                >
                  Selecionar arquivo
                </button>

                {/* Nome do arquivo selecionado */}
                <span className="text-sm text-gray-700 truncate max-w-[240px]">
                  {(modal.data as any)._file
                    ? (modal.data as any)._file.name
                    : "Nenhum arquivo selecionado"}
                </span>
              </div>

              {/* Input real oculto */}
              <input
                id="fileInputHidden"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file =
                    e.target.files && e.target.files[0]
                      ? e.target.files[0]
                      : null;
                  setModal((prev) => ({
                    ...(prev as any),
                    data: { ...((prev as any).data || {}), _file: file },
                  }));
                }}
              />

              <p className="text-[11px] text-gray-500 mt-1">
                Se escolher um arquivo, a URL acima será ignorada e o link será
                criado a partir do upload.
              </p>
            </div>

            {/* DIRETÓRIO DE UPLOAD */}
            <div>
              <label className="text-xs block mb-1">
                Diretório de upload (opcional)
              </label>
              <input
                className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm bg-white"
                placeholder="Ex.: AC/CVE-AC-7kW"
                value={
                  (modal.data as any)._dir ||
                  `${modal.release.productCategory || ""}/${
                    modal.release.productName || ""
                  }`
                }
                onChange={(e) =>
                  setModal((prev) => ({
                    ...(prev as any),
                    data: {
                      ...((prev as any).data || {}),
                      _dir: e.target.value,
                    },
                  }))
                }
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Se vazio, o arquivo vai para o diretório atual{" "}
                {`"${modal.release.productCategory}/${modal.release.productName}"`}
                .
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-between gap-2">
          {modal.mode === "edit" && (
            <button
              onClick={() => {
                if (modal.type === "release")
                  return askDeleteRelease(modal.release);
                if (modal.type === "module")
                  return askDeleteModule(
                    modal.release,
                    modal.data as ReleaseModule
                  );
                if (modal.type === "entry")
                  return askDeleteEntry(
                    modal.release,
                    modal.data as ReleaseEntry
                  );
                if (modal.type === "link")
                  return askDeleteLink(
                    modal.release,
                    modal.data as ReleaseLink
                  );
              }}
              className="px-3 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 text-sm"
              disabled={saving}
            >
              Excluir
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-md border dark:border-zinc-700 hover:bg-gray-100 text-sm"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (modal.type === "release") return saveRelease();
                if (modal.type === "module") return saveModule();
                if (modal.type === "entry") return saveEntry();
                if (modal.type === "link") return saveLink();
              }}
              disabled={saving}
              className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

function EditModalPortal(props: EditModalProps) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let el = document.getElementById("modal-root") as HTMLElement | null;
    if (!el) {
      el = document.createElement("div");
      el.id = "modal-root";
      document.body.appendChild(el);
    }
    setHost(el);
  }, []);
  if (!host) return null;
  return createPortal(<EditModal {...props} />, host);
}

type ConfirmPortalProps = {
  confirm: ConfirmState;
  setConfirm: React.Dispatch<React.SetStateAction<ConfirmState>>;
  doConfirmedDelete: () => Promise<void>;
};

const ConfirmModal = memo(function ConfirmModal({
  confirm,
  setConfirm,
  doConfirmedDelete,
}: ConfirmPortalProps) {
  if (!confirm.open) return null;
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onMouseDown={() => setConfirm({ open: false })}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white dark:bg-white text-gray-900 dark:text-gray-900 p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-1">{confirm.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {confirm.message}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setConfirm({ open: false })}
            className="px-3 py-2 rounded-md border dark:border-zinc-700 hover:bg-gray-100  text-sm"
            disabled={confirm.busy}
          >
            Cancelar
          </button>
          <button
            onClick={doConfirmedDelete}
            className="px-3 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 text-sm disabled:opacity-50"
            disabled={confirm.busy}
          >
            {confirm.busy ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
});

function ConfirmPortal(props: ConfirmPortalProps) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let el = document.getElementById("confirm-root") as HTMLElement | null;
    if (!el) {
      el = document.createElement("div");
      el.id = "confirm-root";
      document.body.appendChild(el);
    }
    setHost(el);
  }, []);
  if (!host) return null;
  return createPortal(<ConfirmModal {...props} />, host);
}

function buildDataJSONForMultipart(
  base: Release,
  mutate?: (r: Release) => Release
) {
  const r = mutate ? mutate(base) : base;
  // reaproveita seu builder para manter consistência do payload
  const json = {
    version: r.version,
    previousVersion: r.previousVersion,
    ota: r.ota,
    otaObs: r.otaObs || "",
    releaseDate: r.releaseDate,
    importantNote: r.importantNote || "",
    productCategory: r.productCategory,
    productName: r.productName,
    status: r.status,
    modules: (r.modules || []).map((m) => ({
      module: m.module,
      version: m.version,
      updated: m.updated,
    })),
    entries: (r.entries || []).map((e) => ({
      itemOrder: e.itemOrder,
      classification: e.classification,
      observation: e.observation,
    })),
    links: (r.links || []).map((l) => ({
      module: l.module,
      description: l.description,
      url: l.url,
    })),
  };
  return JSON.stringify(json);
}

// Envia: data(JSON) + dir + N arquivos + pares linkModule[]/linkDescription[]
async function putReleaseMultipart(
  releaseId: number,
  base: Release,
  uploads: Array<{ file: File; module: string; description: string }>,
  dir?: string
) {
  const fd = new FormData();
  // JSON da release (já sem os links que serão substituídos)
  fd.append("data", buildDataJSONForMultipart(base));
  if (dir) fd.append("dir", dir);

  uploads.forEach((u) => {
    fd.append("files[]", u.file);
    fd.append("linkModule[]", u.module || "default");
    fd.append("linkDescription[]", u.description || "Firmware");
  });

  // Não fixe Content-Type. O browser define boundary.
  await api.put(`/releases/${releaseId}`, fd);
}
