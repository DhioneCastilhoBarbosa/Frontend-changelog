import { KeySquareIcon, Lock, Mail, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";



export default function SignUp() {
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Aqui você faria a lógica de cadastro (API, validação, etc.)
   
     toast.success('Cadastro realizado com sucesso! Entre em contato com a equipe de CVE para ativar sua conta.', {
      closeButton: true
    });
    navigate("/login");
  };

  const handleLogin = () => {
    navigate("/login"); // redireciona para a página de login
  };

  return (
    <div className="flex items-center justify-center h-screen bg-white text-black dark:bg-zinc-900 dark:text-white">
    <div className="flex flex-col justify-center items-center transition-colors duration-300 bg-white text-black dark:bg-zinc-800 dark:text-white border-2 min-w-96 w-96 p-8 border-sky-300 rounded-2xl shadow-lg ring-1 ring-slate-200 dark:ring-zinc-700">
      <KeySquareIcon size={64} className="mb-4" />
      <h1 className="text-4xl font-bold">License</h1>
      <h2 className="mt-8 text-2xl">Crie sua conta</h2>

      <label className="font-light mt-2">
        Já possui uma conta?{" "}
        <button
          type="button"
          onClick={() => handleLogin()}
          className="text-sky-500 underline hover:text-sky-600 transition-colors"
        >
          Entrar
        </button>
      </label>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-center items-center gap-4 mt-8 w-full max-w-md"
      >
        {/* Nome */}
        <label className="flex items-center gap-2 border-2 border-sky-300 p-2 rounded-md w-full transition-colors focus-within:border-sky-500 focus-within:bg-sky-50 dark:focus-within:bg-zinc-800">
          <User className="w-5 h-5 text-sky-500" />
          <div className="flex flex-row items-center gap-2 w-full">
            <span className="text-sm text-gray-600 dark:text-gray-300">Nome:</span>
            <input
              type="text"
              name="name"
              className="bg-transparent outline-none border-none text-black dark:text-white placeholder:text-gray-400 w-full"
              placeholder="Digite seu nome completo"
              required
            />
          </div>
        </label>

        {/* Email */}
        <label className="flex items-center gap-2 border-2 border-sky-300 p-2 rounded-md w-full transition-colors focus-within:border-sky-500 focus-within:bg-sky-50 dark:focus-within:bg-zinc-800">
          <Mail className="w-5 h-5 text-sky-500" />
          <div className="flex flex-row items-center gap-2 w-full">
            <span className="text-sm text-gray-600 dark:text-gray-300">Email:</span>
            <input
              type="email"
              name="email"
              className="bg-transparent outline-none border-none text-black dark:text-white placeholder:text-gray-400 w-full"
              placeholder="Digite seu e-mail"
              required
            />
          </div>
        </label>

        {/* Senha */}
        <label className="flex items-center gap-2 border-2 border-sky-300 p-2 rounded-md w-full transition-colors focus-within:border-sky-500 focus-within:bg-sky-50 dark:focus-within:bg-zinc-800">
          <Lock className="w-5 h-5 text-sky-500" />
          <div className="flex flex-row items-center gap-2 w-full">
            <span className="text-sm text-gray-600 dark:text-gray-300">Senha:</span>
            <input
              type="password"
              name="password"
              className="bg-transparent outline-none border-none text-black dark:text-white placeholder:text-gray-400 w-full"
              placeholder="Crie uma senha"
              required
            />
          </div>
        </label>

        <button
          type="submit"
          className="bg-sky-500 text-white p-2 rounded-md w-full hover:bg-sky-600 transition cursor-pointer"
        >
          Cadastrar
        </button>
      </form>
    </div>
  </div>
  );
}
