// src/pages/approvals/approval.tsx
import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { Inbox, Plus, FileText, Trash2 } from "lucide-react";
import api from "../../services/api";
import { toast } from "sonner";

type UserPublic = {
  id: number;
  name: string;
  role: string;
};

type Approval = {
  id: number;
  establishment: string;
  date: string;
  productName: string;
  category: string;
  description: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserPublic | null;
};

type ModalMode = "add" | "edit";

type ModalState =
  | {
      open: true;
      mode: ModalMode;
      approval?: Approval;
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

type ApprovalForm = {
  establishment: string;
  date: string;
  productName: string;
  category: string;
  description: string;
  file: File | null;
};

const emptyForm: ApprovalForm = {
  establishment: "",
  date: "",
  productName: "",
  category: "",
  description: "",
  file: null,
};

export default function ApprovalPage() {
  const [data, setData] = useState<Approval[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Todos");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ApprovalForm>(emptyForm);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getData = useCallback(async () => {
    try {
      const res = await api.get("/v1/approvals");
      setData(res.data as Approval[]);
    } catch (err: any) {
      console.error(err);
      toast.error("Falha ao carregar homologações.");
    }
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);

  const fmtDate = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return data.filter((a) => {
      const matchesSearch =
        !s ||
        a.establishment.toLowerCase().includes(s) ||
        a.productName.toLowerCase().includes(s) ||
        a.category.toLowerCase().includes(s) ||
        a.description.toLowerCase().includes(s);

      const matchesCategory =
        categoryFilter === "Todos"
          ? true
          : a.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [data, search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const openModalAdd = () => {
    setForm(emptyForm);
    setModal({ open: true, mode: "add" });
  };

  /*const openModalEdit = (approval: Approval) => {
    setForm({
      establishment: approval.establishment,
      date: approval.date ? approval.date.slice(0, 10) : "",
      productName: approval.productName,
      category: approval.category,
      description: approval.description,
      file: null,
    });
    setModal({ open: true, mode: "edit", approval });
  };*/

  const closeModal = () => setModal({ open: false });

  const confirmDelete = (approval: Approval, action: () => Promise<void>) => {
    setConfirm({
      open: true,
      title: "Excluir homologação",
      message: `Confirma excluir a homologação ID: ${approval.id} (${approval.productName})? Esta ação é irreversível.`,
      onConfirm: action,
      busy: false,
    });
  };

  const doConfirmedDelete = async () => {
    if (!confirm.open) return;
    setConfirm((prev) => ({ ...(prev as any), busy: true }));
    try {
      await confirm.onConfirm();
      await getData();
    } finally {
      setConfirm({ open: false });
    }
  };

  const handleChange = (patch: Partial<ApprovalForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleFileChange = (file: File | null) =>
    setForm((prev) => ({ ...prev, file }));

  const handleSubmit = async () => {
    if (!modal.open) return;

    if (!form.establishment || !form.productName || !form.category) {
      toast.error("Preencha Estabelecimento, Produto e Categoria.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("establishment", form.establishment);
      fd.append("productName", form.productName);
      fd.append("category", form.category);
      fd.append("description", form.description);
      if (form.date) {
        fd.append("date", form.date); // backend faz o parse
      }
      if (form.file) {
        fd.append("file", form.file);
      }

      if (modal.mode === "add") {
        if (!form.file) {
          toast.error("Selecione um arquivo para anexar.");
          setSaving(false);
          return;
        }
        await api.post("/v1", fd, {
          headers: {
            // boundary automático
          },
        });
        toast.success("Homologação cadastrada com sucesso.");
      } else if (modal.mode === "edit" && modal.approval) {
        await api.put(`/v1/approvals/${modal.approval.id}`, fd, {
          headers: {
            // boundary automático
          },
        });
        toast.success("Homologação atualizada com sucesso.");
      }

      await getData();
      closeModal();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Falha ao salvar homologação.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (approval: Approval) => {
    confirmDelete(approval, async () => {
      await api.delete(`/v1/approvals/${approval.id}`);
    });
  };

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set).sort();
  }, [data]);

  return (
    <div className=" md:py-6 md:px-40 md:mt-10 space-y-4 ">
      {/* Filtros + ação */}
      <div className="rounded-xl shadow-lg ring-1 ring-slate-200 dark:ring-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <input
            className="w-full md:flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
            placeholder="Buscar por estabelecimento, produto ou categoria"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setPage(1);
              setCategoryFilter(e.target.value);
            }}
            className="w-full md:w-64 px-3 py-2 rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
          >
            <option value="Todos">Todas as categorias</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={openModalAdd}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nova homologação
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className=" overflow-hidden rounded-xl shadow-lg ring-1 ring-slate-200 dark:ring-zinc-700">
        <div
          className="overflow-x-auto md:overflow-visible"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700 text-sm">
            <thead className="bg-gray-100 dark:bg-zinc-800">
              <tr className="whitespace-nowrap">
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Estabelecimento
                </th>
                <th className="px-4 py-3 text-left font-semibold">Produto</th>
                <th className="px-4 py-3 text-left font-semibold">Categoria</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Data homologação
                </th>
                <th className="px-4 py-3 text-left font-semibold">Arquivo</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
              {pageData.map((a) => {
                const expanded = expandedId === a.id;
                return (
                  <React.Fragment key={a.id}>
                    <tr className="align-top">
                      <td className="px-4 py-3">{a.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{a.establishment}</div>
                      </td>
                      <td className="px-4 py-3">{a.productName}</td>
                      <td className="px-4 py-3">{a.category}</td>
                      <td className="px-4 py-3">{fmtDate(a.date)}</td>
                      <td className="px-4 py-3">
                        {a.fileUrl ? (
                          <a
                            href={a.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-xs">Abrir arquivo</span>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">Nenhum</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() =>
                              setExpandedId(expanded ? null : a.id)
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs"
                            aria-expanded={expanded}
                            aria-controls={`approval-details-${a.id}`}
                          >
                            {expanded ? "Recolher" : "Detalhes"}
                          </button>
                          {/*<button
                            onClick={() => openModalEdit(a)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs"
                          >
                            Editar
                          </button>*/}
                          <button
                            onClick={() => handleDelete(a)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 text-xs"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expanded && (
                      <tr>
                        <td
                          colSpan={7}
                          id={`approval-details-${a.id}`}
                          className="px-4 pb-4 bg-gray-50 dark:bg-zinc-900/50"
                        >
                          <div className="mt-2 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-900">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-sm">
                                Detalhes da homologação #{a.id}
                              </h4>
                              {a.createdBy && (
                                <span className="text-[11px] text-gray-500">
                                  Criado por: {a.createdBy.name} (
                                  {a.createdBy.role})
                                </span>
                              )}
                            </div>

                            <dl className="grid md:grid-cols-2 gap-3 text-sm mb-3">
                              <div>
                                <dt className="text-xs text-gray-500">
                                  Estabelecimento
                                </dt>
                                <dd className="font-medium">
                                  {a.establishment}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs text-gray-500">
                                  Produto
                                </dt>
                                <dd className="font-medium">{a.productName}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-gray-500">
                                  Categoria
                                </dt>
                                <dd>{a.category}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-gray-500">
                                  Data homologação
                                </dt>
                                <dd>{fmtDate(a.date)}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-gray-500">
                                  Criado em
                                </dt>
                                <dd>{fmtDate(a.createdAt)}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-gray-500">
                                  Atualizado em
                                </dt>
                                <dd>{fmtDate(a.updatedAt)}</dd>
                              </div>
                            </dl>

                            <div className="mt-2">
                              <div className="text-xs font-semibold text-gray-500 mb-1">
                                Descrição
                              </div>
                              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                {a.description || "Sem descrição registrada."}
                              </p>
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
                    Nenhuma homologação encontrada
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

      {/* Modal de cadastro/edição */}
      <ApprovalModalPortal
        modal={modal}
        form={form}
        saving={saving}
        onClose={closeModal}
        onChange={handleChange}
        onFileChange={handleFileChange}
        onSubmit={handleSubmit}
      />

      {/* Modal de confirmação */}
      <ConfirmPortal
        confirm={confirm}
        setConfirm={setConfirm}
        doConfirmedDelete={doConfirmedDelete}
      />
    </div>
  );
}

/* ===== Modal de criação/edição em Portal ===== */

type ApprovalModalProps = {
  modal: ModalState;
  form: ApprovalForm;
  saving: boolean;
  onClose: () => void;
  onChange: (patch: Partial<ApprovalForm>) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: () => Promise<void> | void;
};

const ApprovalModal = memo(function ApprovalModal({
  modal,
  form,
  saving,
  onClose,
  onChange,
  onFileChange,
  onSubmit,
}: ApprovalModalProps) {
  if (!modal.open) return null;

  const common =
    "w-full px-3 py-2 rounded-md border border-gray-300 text-sm bg-white dark:bg-white text-gray-900 dark:text-gray-900 placeholder:text-gray-500";

  const title =
    modal.mode === "edit" ? "Editar homologação" : "Nova homologação";

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
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-xs text-gray-500">
            Registre ou atualize uma homologação com laudo anexado.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs block mb-1">Estabelecimento</label>
            <input
              className={common}
              value={form.establishment}
              onChange={(e) => onChange({ establishment: e.target.value })}
              placeholder="Ex.: Loja X, Condomínio Y..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1">Produto</label>
              <input
                className={common}
                value={form.productName}
                onChange={(e) => onChange({ productName: e.target.value })}
                placeholder="Ex.: Carregador AC 7kW"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">Categoria</label>
              <input
                className={common}
                value={form.category}
                onChange={(e) => onChange({ category: e.target.value })}
                placeholder="Ex.: AC, DC, Telecom..."
              />
            </div>
          </div>

          <div>
            <label className="text-xs block mb-1">Data da homologação</label>
            <input
              type="date"
              className={common}
              value={form.date}
              onChange={(e) => onChange({ date: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs block mb-1">Descrição</label>
            <textarea
              className={common}
              rows={4}
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Resumo dos testes, observações importantes, restrições, etc."
            />
          </div>

          <div>
            <label className="text-xs block mb-1">Arquivo de laudo</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  document.getElementById("approval-file-input")?.click()
                }
                className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
              >
                Selecionar arquivo
              </button>
              <span className="text-sm text-gray-700 truncate max-w-[260px]">
                {form.file ? form.file.name : "Nenhum arquivo selecionado"}
              </span>
            </div>
            <input
              id="approval-file-input"
              type="file"
              className="hidden"
              onChange={(e) => {
                const file =
                  e.target.files && e.target.files[0]
                    ? e.target.files[0]
                    : null;
                onFileChange(file);
              }}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              No cadastro, o arquivo é obrigatório. Na edição, enviar um novo
              arquivo substitui o atual.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-md border dark:border-zinc-700 hover:bg-gray-100 text-sm"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
});

function ApprovalModalPortal(props: ApprovalModalProps) {
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
  return createPortal(<ApprovalModal {...props} />, host);
}

/* ===== Modal de confirmação ===== */

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
            className="px-3 py-2 rounded-md border dark:border-zinc-700 hover:bg-gray-100 text-sm"
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
