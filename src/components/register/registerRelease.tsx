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

// filename é só para UI (mostrar nome do arquivo selecionado)
type ReleaseLinkInput = {
  module: string;
  description: string;
  url: string;
  filename?: string;
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
  links: ReleaseLinkInput[];
};

function toApiDate(v?: string) {
  if (!v) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00Z`;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

const commonInput =
  "w-full px-3 py-2 rounded-md border border-gray-300 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400";

type FwMode = "upload" | "link";

const CreateReleaseForm = memo(function CreateReleaseForm({
  value,
  setValue,
  saving,
  onCancel,
  onSubmit,
  fwMode,
  setFwMode,
  fwDirName,
  setFwDirName,
}: {
  value: NewReleaseInput;
  setValue: React.Dispatch<React.SetStateAction<NewReleaseInput>>;
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  fwMode: FwMode;
  setFwMode: (m: FwMode) => void;
  fwDirName: string;
  setFwDirName: (s: string) => void;
}) {
  const setField = (patch: Partial<NewReleaseInput>) =>
    setValue((v) => ({ ...v, ...patch }));

  const addModule = () =>
    setValue((v) => ({
      ...v,
      modules: [...v.modules, { module: "", version: "", updated: false }],
    }));

  const addLink = () =>
    setValue((v) => ({
      ...v,
      links: [...v.links, { module: "", description: "", url: "" }],
    }));

  const removeLink = (idx: number) =>
    setValue((v) => ({ ...v, links: v.links.filter((_, i) => i !== idx) }));

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

  const hasCategory = !!value.productCategory;

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
            <select
              className={commonInput}
              value={value.productCategory}
              onChange={(e) => setField({ productCategory: e.target.value })}
            >
              <option value="">Selecione...</option>
              <option value="AC">AC</option>
              <option value="DC">DC</option>
            </select>
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
            <label className="text-xs block mb-1">Nota</label>
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
                <tr
                  key={idx}
                  className="border-t border-gray-200 dark:border-zinc-700"
                >
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
                className="p-2 rounded-md border border-gray-300 dark:border-zinc-700 space-y-2"
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
                      placeholder="NOVO"
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

      {/* Firmware só depois de selecionar categoria */}
      {hasCategory && (
        <>
          {/* Origem do firmware */}
          <section className="mt-10">
            <h4 className="font-semibold mb-2">Origem do firmware</h4>
            <div className="flex gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="fwMode"
                  checked={fwMode === "upload"}
                  onChange={() => setFwMode("upload")}
                />
                Upload de arquivo
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="fwMode"
                  checked={fwMode === "link"}
                  onChange={() => setFwMode("link")}
                />
                Já tenho o link do arquivo
              </label>
            </div>
          </section>

          {/* Upload de Firmware – layout similar ao de links, com botão no topo, diretório, textarea de descrição e botão azul de arquivo */}
          {fwMode === "upload" && (
            <section className="mt-10">
              {/* Header + botão adicionar outro firmware */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">Uploads de firmware</h4>
                  <div className="mt-2">
                    <label className="text-xs block mb-1">Diretório</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm px-2 py-2 rounded-md bg-gray-100 dark:bg-zinc-800">
                        {value.productCategory || "<CAT>"}/
                      </span>
                      <input
                        className={commonInput + " flex-1"}
                        value={fwDirName}
                        onChange={(e) => setFwDirName(e.target.value)}
                        placeholder={value.productName || "nome_do_produto"}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Resultado: /firmware/{value.productCategory || "<CAT>"}/
                      {fwDirName || value.productName || "<DIR>"}
                      /nome_do_arquivo
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addLink}
                  className="h-8 px-3 py-1 rounded-md border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs mt-1"
                >
                  Adicionar Firmware
                </button>
              </div>

              {value.links.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Nenhum firmware configurado.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {value.links.map((l, idx) => (
                    <li
                      key={idx}
                      className="p-2 rounded-md border border-gray-200 dark:border-zinc-700 space-y-2"
                    >
                      {/* Módulo */}
                      <div>
                        <label className="text-xs block mb-1">Módulo</label>
                        <input
                          className={commonInput}
                          value={l.module}
                          onChange={(e) => {
                            const module = e.target.value;
                            setValue((v) => {
                              const links = [...v.links];
                              links[idx] = { ...links[idx], module };
                              return { ...v, links };
                            });
                          }}
                          placeholder="MainBoard"
                        />
                      </div>

                      {/* Descrição abaixo do módulo, como textarea */}
                      <div>
                        <label className="text-xs block mb-1">Descrição</label>
                        <textarea
                          className={commonInput}
                          rows={3}
                          value={l.description}
                          onChange={(e) => {
                            const description = e.target.value;
                            setValue((v) => {
                              const links = [...v.links];
                              links[idx] = { ...links[idx], description };
                              return { ...v, links };
                            });
                          }}
                          placeholder="Firmware principal"
                        />
                      </div>

                      {/* Arquivo com botão azul + label do nome */}
                      <div>
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`fw-file-${idx}`}
                            className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                          >
                            Selecionar arquivo
                          </label>
                          <input
                            id={`fw-file-${idx}`}
                            type="file"
                            className="hidden fw-input"
                            data-idx={idx}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setValue((v) => {
                                const links = [...v.links];
                                links[idx] = {
                                  ...links[idx],
                                  filename: file?.name || "",
                                };
                                return { ...v, links };
                              });
                            }}
                          />
                          {l.filename ? (
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[220px]">
                              {l.filename}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                              Nenhum arquivo selecionado
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setValue((v) => ({
                              ...v,
                              links: v.links.filter((_, i) => i !== idx),
                            }))
                          }
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
          )}

          {/* Firmwares via link (modo link, layout original) */}
          {fwMode === "link" && (
            <section className="mt-10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">
                  Firmwares - servidores externos
                </h4>
                <button
                  type="button"
                  onClick={addLink}
                  className="px-2 py-1 rounded-md border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs"
                >
                  Adicionar Firmware
                </button>
              </div>

              {value.links.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sem firmwares
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {value.links.map((l, idx) => (
                    <li
                      key={idx}
                      className="p-2 rounded-md border border-gray-200 dark:border-zinc-700 space-y-2"
                    >
                      <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-2">
                          <label className="text-xs block mb-1">Módulo</label>
                          <input
                            className={commonInput}
                            value={l.module}
                            onChange={(e) => {
                              const module = e.target.value;
                              setValue((v) => {
                                const links = [...v.links];
                                links[idx] = { ...links[idx], module };
                                return { ...v, links };
                              });
                            }}
                            placeholder="MainBoard"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs block mb-1">URL</label>
                          <input
                            className={commonInput}
                            value={l.url}
                            onChange={(e) => {
                              const url = e.target.value;
                              setValue((v) => {
                                const links = [...v.links];
                                links[idx] = { ...links[idx], url };
                                return { ...v, links };
                              });
                            }}
                            placeholder="https://cdn.exemplo.com/fw/mainboard-1.8.0.bin"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs block mb-1">Descrição</label>
                        <textarea
                          className={commonInput}
                          rows={3}
                          value={l.description}
                          onChange={(e) => {
                            const description = e.target.value;
                            setValue((v) => {
                              const links = [...v.links];
                              links[idx] = { ...links[idx], description };
                              return { ...v, links };
                            });
                          }}
                          placeholder="Descrição"
                        />
                      </div>

                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => removeLink(idx)}
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
          )}
        </>
      )}

      {/* Ações */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-24 px-3 py-2 rounded-md border hover:bg-gray-100 text-sm"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="w-24 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
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
    links: [{ module: "", description: "", url: "" }],
  });

  const [fwMode, setFwMode] = useState<FwMode>("upload");
  const [fwDirName, setFwDirName] = useState(""); // parte após a categoria

  const RETURN_TO = "/dashboard";
  const goToList = () => navigate(RETURN_TO, { replace: true });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const isUrl = (u: string) => /^https?:\/\/\S+/i.test(u);

      // valida links no modo "link"
      if (fwMode === "link") {
        for (const l of form.links) {
          const filled =
            l.module.trim() || l.description.trim() || l.url.trim();
          if (filled && !isUrl(l.url.trim())) {
            toast.error(
              "Informe uma URL válida para cada firmware com link preenchido."
            );
            setSaving(false);
            return;
          }
        }
      }

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
        links:
          fwMode === "link"
            ? form.links
                .filter((l) => l.url.trim())
                .map((l) => ({
                  module: l.module.trim(),
                  description: l.description.trim(),
                  url: l.url.trim(),
                }))
            : [],
      };

      const cat = form.productCategory.trim();
      const dirName = fwDirName.trim() || form.productName.trim();
      const dir = `${cat}/${dirName}`;

      if (fwMode === "upload") {
        // pegar todos inputs de arquivo da página
        const fileEls = Array.from(
          document.querySelectorAll<HTMLInputElement>("input.fw-input")
        );

        const files: File[] = [];
        const modules: string[] = [];
        const descriptions: string[] = [];

        fileEls.forEach((el) => {
          const idx = Number(el.dataset.idx);
          const file = el.files?.[0];
          if (file) {
            files.push(file);
            const l = form.links[idx] || { module: "", description: "" };
            modules.push((l.module || "").trim() || "default");
            descriptions.push((l.description || "").trim() || "Firmware");
          }
        });

        if (files.length === 0) {
          toast.error("Selecione ao menos um arquivo para upload.");
          setSaving(false);
          return;
        }

        if (!cat || !dirName) {
          toast.error("Informe categoria e diretório para upload.");
          setSaving(false);
          return;
        }

        const fd = new FormData();
        fd.append("data", JSON.stringify(payload));
        fd.append("dir", dir);
        files.forEach((f) => fd.append("files[]", f));
        modules.forEach((m) => fd.append("linkModule[]", m));
        descriptions.forEach((d) => fd.append("linkDescription[]", d));

        await api.post("/releases", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        if (payload.links.length === 0) {
          toast.error("Informe ao menos um link de firmware.");
          setSaving(false);
          return;
        }
        for (const l of payload.links) {
          if (!l.module || !l.description || !isUrl(l.url)) {
            toast.error(
              "Preencha Módulo, Descrição e uma URL válida em cada link."
            );
            setSaving(false);
            return;
          }
        }
        await api.post("/releases", payload);
      }

      toast.success("Release criada com sucesso.");
      setForm({
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
        links: [{ module: "", description: "", url: "" }],
      });
      setFwMode("upload");
      setFwDirName("");
      goToList();
    } catch (err: any) {
      console.error(
        "POST /releases error:",
        err?.response?.status,
        err?.response?.data
      );
      toast.error(
        err?.response?.data?.message ||
          "Falha ao salvar release. Verifique os campos e permissões."
      );
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
        fwMode={fwMode}
        setFwMode={setFwMode}
        fwDirName={fwDirName}
        setFwDirName={setFwDirName}
      />
    </div>
  );
}
