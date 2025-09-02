import React, { useMemo, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { toast } from "sonner";

type ModuleInput = { module: string; version: string; updated: boolean };
type EntryInput = {
  itemOrder: number;
  classification: string;
  observation: string;
};
type Status = "revisao" | "producao" | "descontinuado";

type NewReleaseInput = {
  version: string;
  previousVersion: string;
  ota: boolean;
  otaObs: string;
  releaseDate: string; // YYYY-MM-DD
  importantNote: string;
  productCategory: string;
  productName: string;
  status: Status;
  modules: ModuleInput[];
  entries: EntryInput[];
};

function toApiDate(v?: string) {
  if (!v) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00Z`;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

const commonInput =
  "w-full px-3 py-2 rounded-md border border-gray-300 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400";

const CreateReleaseForm = memo(function CreateReleaseForm({
  value,
  setValue,
  saving,
  onCancel,
  onSubmit,
}: {
  value: NewReleaseInput;
  setValue: React.Dispatch<React.SetStateAction<NewReleaseInput>>;
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
}) {
  const setField = (patch: Partial<NewReleaseInput>) =>
    setValue((v) => ({ ...v, ...patch }));

  const addModule = () =>
    setValue((v) => ({
      ...v,
      modules: [...v.modules, { module: "", version: "", updated: false }],
    }));
  const removeModule = (idx: number) =>
    setValue((v) => ({ ...v, modules: v.modules.filter((_, i) => i !== idx) }));

  const addEntry = () =>
    setValue((v) => ({
      ...v,
      entries: [
        ...v.entries,
        {
          itemOrder: (v.entries[v.entries.length - 1]?.itemOrder ?? 0) + 1,
          classification: "",
          observation: "",
        },
      ],
    }));
  const removeEntry = (idx: number) =>
    setValue((v) => ({ ...v, entries: v.entries.filter((_, i) => i !== idx) }));

  const canSubmit = useMemo(
    () =>
      value.version.trim() &&
      value.productName.trim() &&
      value.productCategory.trim() &&
      value.releaseDate.trim(),
    [value]
  );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!saving && canSubmit) await onSubmit();
      }}
      className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 p-6 shadow-2xl"
    >
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Nova Release</h1>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Preencha os campos e salve.
        </p>
      </div>

      {/* Dados básicos */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs block mb-1">Versão</label>
            <input
              className={commonInput}
              value={value.version}
              onChange={(e) => setField({ version: e.target.value })}
              placeholder="1.2.7"
            />
          </div>
          <div>
            <label className="text-xs block mb-1">Versão anterior</label>
            <input
              className={commonInput}
              value={value.previousVersion}
              onChange={(e) => setField({ previousVersion: e.target.value })}
              placeholder="1.2.6"
            />
          </div>
          <div>
            <label className="text-xs block mb-1">Produto</label>
            <input
              className={commonInput}
              value={value.productName}
              onChange={(e) => setField({ productName: e.target.value })}
              placeholder="Nome do produto"
            />
          </div>
          <div>
            <label className="text-xs block mb-1">Categoria</label>
            <input
              className={commonInput}
              value={value.productCategory}
              onChange={(e) => setField({ productCategory: e.target.value })}
              placeholder="AC"
            />
          </div>
          <div>
            <label className="text-xs block mb-1">Status</label>
            <select
              className={commonInput}
              value={value.status}
              onChange={(e) => setField({ status: e.target.value as Status })}
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
              className={commonInput}
              value={value.releaseDate}
              onChange={(e) => setField({ releaseDate: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs block mb-1">Importante</label>
            <textarea
              className={commonInput}
              rows={3}
              value={value.importantNote}
              onChange={(e) => setField({ importantNote: e.target.value })}
              placeholder="Correções críticas"
            />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.ota}
                onChange={(e) => setField({ ota: e.target.checked })}
              />
              Atualizável via OTA?
            </label>
            <input
              className={commonInput}
              placeholder="Observações sobre OTA"
              value={value.otaObs}
              onChange={(e) => setField({ otaObs: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Módulos */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Módulos</h4>
          <button
            type="button"
            onClick={addModule}
            className="px-2 py-1 rounded-md border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs"
          >
            Adicionar Módulo
          </button>
        </div>
        {value.modules.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Sem módulos
          </p>
        ) : (
          <table className="w-full text-sm border border-gray-200 dark:border-zinc-700 rounded-md overflow-hidden">
            <thead className="bg-gray-100 dark:bg-zinc-800">
              <tr className="border-t border-gray-200 dark:border-zinc-700">
                <th className="px-3 py-2 text-left">Módulo</th>
                <th className="px-3 py-2 text-left">Versão</th>
                <th className="px-3 py-2 text-left">Atualizado</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {value.modules.map((m, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">
                    <input
                      className={commonInput}
                      value={m.module}
                      onChange={(e) => {
                        const module = e.target.value;
                        setValue((v) => {
                          const modules = [...v.modules];
                          modules[idx] = { ...modules[idx], module };
                          return { ...v, modules };
                        });
                      }}
                      placeholder="Display"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className={commonInput}
                      value={m.version}
                      onChange={(e) => {
                        const version = e.target.value;
                        setValue((v) => {
                          const modules = [...v.modules];
                          modules[idx] = { ...modules[idx], version };
                          return { ...v, modules };
                        });
                      }}
                      placeholder="1.66"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={m.updated}
                        onChange={(e) => {
                          const updated = e.target.checked;
                          setValue((v) => {
                            const modules = [...v.modules];
                            modules[idx] = { ...modules[idx], updated };
                            return { ...v, modules };
                          });
                        }}
                      />
                      <span className="text-sm">Atualizado</span>
                    </label>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeModule(idx)}
                      className="px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 text-xs"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Registros */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Registros</h4>
          <button
            type="button"
            onClick={addEntry}
            className="px-2 py-1 rounded-md border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs"
          >
            Adicionar Registro
          </button>
        </div>
        {value.entries.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Sem registros
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {value.entries.map((e, idx) => (
              <li
                key={idx}
                className="p-2 rounded-md border border-gray-200 space-y-2"
              >
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs block mb-1">Ordem</label>
                    <input
                      type="number"
                      className={commonInput}
                      value={e.itemOrder}
                      onChange={(ev) => {
                        const itemOrder = Number(ev.target.value);
                        setValue((v) => {
                          const entries = [...v.entries];
                          entries[idx] = { ...entries[idx], itemOrder };
                          return { ...v, entries };
                        });
                      }}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs block mb-1">Classificação</label>
                    <input
                      className={commonInput}
                      value={e.classification}
                      onChange={(ev) => {
                        const classification = ev.target.value;
                        setValue((v) => {
                          const entries = [...v.entries];
                          entries[idx] = { ...entries[idx], classification };
                          return { ...v, entries };
                        });
                      }}
                      placeholder=""
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs block mb-1">Observação</label>
                  <textarea
                    className={commonInput}
                    rows={3}
                    value={e.observation}
                    onChange={(ev) => {
                      const observation = ev.target.value;
                      setValue((v) => {
                        const entries = [...v.entries];
                        entries[idx] = { ...entries[idx], observation };
                        return { ...v, entries };
                      });
                    }}
                    placeholder="Descrição"
                  />
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => removeEntry(idx)}
                    className="px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 text-xs"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ações */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-md border hover:bg-gray-100 text-sm"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
});

export default function CreateReleasePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NewReleaseInput>({
    version: "",
    previousVersion: "",
    ota: true,
    otaObs: "",
    releaseDate: "",
    importantNote: "",
    productCategory: "",
    productName: "",
    status: "producao",
    modules: [{ module: "", version: "", updated: false }],
    entries: [{ itemOrder: 1, classification: "", observation: "" }],
  });

  // Ajuste este caminho para onde você quer voltar após salvar/cancelar:
  const RETURN_TO = "/dashboard";

  const goToList = () => navigate(RETURN_TO, { replace: true });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        version: form.version.trim(),
        previousVersion: form.previousVersion.trim(),
        ota: !!form.ota,
        otaObs: form.otaObs?.trim() || "",
        releaseDate: toApiDate(form.releaseDate)!, // ISO
        importantNote: form.importantNote?.trim() || "",
        productCategory: form.productCategory.trim(),
        productName: form.productName.trim(),
        status: form.status,
        modules: form.modules.map((m) => ({
          module: m.module.trim(),
          version: m.version.trim(),
          updated: !!m.updated,
        })),
        entries: form.entries.map((e) => ({
          itemOrder: Number(e.itemOrder) || 0,
          classification: e.classification.trim(),
          observation: e.observation.trim(),
        })),
      };
      await api.post("/releases", payload);
      toast.success("Release criada com sucesso.");
      goToList(); // não usa navigate(-1)
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: unknown }).response === "object"
      ) {
        const response = (
          err as { response?: { status?: number; data?: unknown } }
        ).response;
        console.error(
          "POST /releases error:",
          response?.status,
          response?.data
        );
        toast.error(
          typeof response?.data === "object" &&
            response?.data !== null &&
            "message" in response.data
            ? (response.data as { message?: string }).message
            : "Falha ao salvar release. Seu usuário pode não ter permissão para esta ação."
        );
      } else {
        console.error("POST /releases error:", err);
        toast.error(
          "Falha ao salvar release. Seu usuário pode não ter permissão para esta ação."
        );
      }
      // Se seu axios tiver interceptor que desloga em 401, isso ainda pode ocorrer.
      // Caso não queira redirecionar no 401 aqui, remova lógica de logout automática no interceptor.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <CreateReleaseForm
        value={form}
        setValue={setForm}
        saving={saving}
        onCancel={goToList}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
