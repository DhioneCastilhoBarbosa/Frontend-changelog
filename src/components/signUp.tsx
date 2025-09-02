import { ClipboardList, Lock, Mail, User, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../services/api";
import React from "react";

export default function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const mismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    if (mismatch) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/users", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success(
        "Cadastro realizado. Contate a equipe de CVE para ativar sua conta.",
        { closeButton: true }
      );
      navigate("/login");
    } catch (err: unknown) {
      let msg = "Falha ao cadastrar. Tente novamente.";
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: unknown }).response === "object"
      ) {
        const response = (
          err as { response?: { data?: { message?: string }; status?: number } }
        ).response as any;
        msg =
          response?.data?.message ||
          (response?.status === 409
            ? "E-mail já cadastrado."
            : "Falha ao cadastrar. Tente novamente.");
        console.error("POST /users error:", response);
      } else {
        console.error("POST /users error:", err);
      }
      toast.error(msg, { closeButton: true });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => navigate("/login");

  return (
    <div className="flex items-center justify-center h-screen bg-white text-black dark:bg-zinc-900 dark:text-white">
      <div className="flex flex-col justify-center items-center transition-colors duration-300 bg-white text-black dark:bg-zinc-800 dark:text-white border-2 min-w-96 w-96 p-8 border-sky-300 rounded-2xl shadow-lg ring-1 ring-slate-200 dark:ring-zinc-700">
        <ClipboardList size={64} className="mb-4" />
        <h1 className="text-4xl font-bold">ChangeLog</h1>
        <h2 className="mt-8 text-2xl">Crie sua conta</h2>

        <label className="font-light mt-2">
          Já possui uma conta?{" "}
          <button
            type="button"
            onClick={handleLogin}
            className="text-sky-500 underline hover:text-sky-600 transition-colors"
          >
            Entrar
          </button>
        </label>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-center items-center gap-4 mt-8 w-full max-w-md"
          noValidate
        >
          {/* Nome */}
          <label className="flex items-center gap-2 border-2 border-sky-300 p-2 rounded-md w-full transition-colors focus-within:border-sky-500 focus-within:bg-sky-50 dark:focus-within:bg-zinc-800">
            <User className="w-5 h-5 text-sky-500" />
            <div className="flex flex-row items-center gap-2 w-full">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Nome:
              </span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={update("name")}
                className="bg-transparent outline-none border-none text-black dark:text-white placeholder:text-gray-400 w-full"
                placeholder="Digite seu nome completo"
                autoComplete="name"
                required
              />
            </div>
          </label>

          {/* Email */}
          <label className="flex items-center gap-2 border-2 border-sky-300 p-2 rounded-md w-full transition-colors focus-within:border-sky-500 focus-within:bg-sky-50 dark:focus-within:bg-zinc-800">
            <Mail className="w-5 h-5 text-sky-500" />
            <div className="flex flex-row items-center gap-2 w-full">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Email:
              </span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={update("email")}
                className="bg-transparent outline-none border-none text-black dark:text-white placeholder:text-gray-400 w-full"
                placeholder="Digite seu e-mail"
                autoComplete="email"
                required
              />
            </div>
          </label>

          {/* Senha */}
          <label
            className={`flex items-center gap-2 border-2 p-2 rounded-md w-full transition-colors focus-within:border-sky-500 focus-within:bg-sky-50 dark:focus-within:bg-zinc-800 ${
              mismatch ? "border-rose-400" : "border-sky-300"
            }`}
          >
            <Lock className="w-5 h-5 text-sky-500" />
            <div className="flex flex-row items-center gap-2 w-full">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Senha:
              </span>
              <div className="relative w-full flex items-center">
                <input
                  type={showPwd ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={update("password")}
                  className="bg-transparent outline-none border-none text-black dark:text-white placeholder:text-gray-400 w-full pr-8"
                  placeholder="Crie uma senha"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  aria-invalid={mismatch}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPwd}
                  className="absolute right-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPwd ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </label>

          {/* Confirmar Senha */}
          <label
            className={`flex items-center gap-2 border-2 p-2 rounded-md w-full transition-colors focus-within:border-sky-500 focus-within:bg-sky-50 dark:focus-within:bg-zinc-800 ${
              mismatch ? "border-rose-400" : "border-sky-300"
            }`}
          >
            <Lock className="w-5 h-5 text-sky-500" />
            <div className="flex flex-row items-center gap-2 w-full">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Confirmar:
              </span>
              <div className="relative w-full flex items-center">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                  className="bg-transparent outline-none border-none text-black dark:text-white placeholder:text-gray-400 w-full pr-8"
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  aria-invalid={mismatch}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={
                    showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"
                  }
                  aria-pressed={showConfirm}
                  className="absolute right-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </label>

          {mismatch && (
            <p className="w-full text-xs text-rose-600 -mt-2">
              As senhas não coincidem.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || mismatch}
            className="bg-sky-500 text-white p-2 rounded-md w-full hover:bg-sky-600 transition cursor-pointer disabled:opacity-60"
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
