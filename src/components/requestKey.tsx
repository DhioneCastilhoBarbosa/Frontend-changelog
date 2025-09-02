import { KeySquareIcon, Loader, Lock, Mail, User } from "lucide-react"

import api from "../services/api";
import { useState } from "react";
import { toast } from "sonner";




export default function RequestKey(){
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  //const navigate = useNavigate();
  
  const handleCreateLicense = async(data: {
    cpf: string
    email: string
    nome: string
  }) => {
    if (!data.cpf || !data.email || !data.nome) {
      toast.error('Por favor, preencha todos os campos.')
      return
    }
    try {
      setLoading(true)
      await api.post('/criar-chave', data)
      console.log('Nova chave:', data)
      toast.success(
        'Chave de acesso criada com sucesso! Verifique na sua caixa de email.',
        {
          duration: Infinity,
          action: {
            label: 'Fechar',
            onClick: () => {
              toast.dismiss(); 
            }
          }
        }
      );
    } catch (error) {
      toast.error('Erro ao criar chave de acesso. Tente novamente.')
      console.error('Erro ao criar chave de acesso:', error)
    }finally {
      setLoading(false)
      
    }
   
  }

  return (
    <div className="flex items-center justify-center h-screen bg-white text-black dark:bg-zinc-900 dark:text-white">
    <div className=" flex flex-col  justify-center items-center transition-colors duration-300 bg-white text-black dark:bg-zinc-800 dark:text-white border-2 min-w-96 w-96 p-8  border-green-300 rounded-2xl shadow-lg ring-1 ring-slate-200 dark:ring-zinc-700" >
      <KeySquareIcon size={64} className="mb-4" />
      <h1 className="text-4xl font-bold">
        License
      </h1>
      <h2 className="mt-8 text-2xl">Bem vindo!</h2>
      <span className="text-center mt-2">Faça sua solicitação da chave para criação da sua conta no <span className="font-bold">Intelbras CVE</span>.</span>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateLicense({ cpf, email,nome:name });
        }}
        className="flex flex-col justify-center items-center gap-4 mt-8 w-full max-w-md"
      >

         <label className="flex items-center gap-2 border-2 border-green-300 p-2 rounded-md w-full transition-colors focus-within:border-green-500 focus-within:bg-sky-50 dark:focus-within:bg-zinc-800">
          <User className="w-5 h-5 text-green-500" />
          <div className="flex flex-row items-center gap-2 w-full">
            <span className="text-sm text-gray-600 dark:text-gray-300">Nome:</span>
            <input
              type="text"
              name="name"
              className="bg-transparent outline-none border-none text-black dark:text-white placeholder:text-gray-400 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              required
            />
          </div>
        </label>

        <label className="flex items-center gap-2 border-2 border-green-300 p-2 rounded-md w-full transition-colors focus-within:border-green-500 focus-within:bg-sky-50 dark:focus-within:bg-zinc-800">
          <Mail className="w-5 h-5 text-green-500" />
          <div className="flex flex-row items-center gap-2 w-full">
            <span className="text-sm text-gray-600 dark:text-gray-300">Email:</span>
            <input
              type="email"
              name="email"
              className="bg-transparent outline-none border-none text-black dark:text-white placeholder:text-gray-400 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              required
            />
          </div>
        </label>

        <label className="flex items-center gap-2 border-2 border-green-300 p-2 rounded-md w-full transition-colors focus-within:border-green-500 focus-within:bg-sky-50 dark:focus-within:bg-zinc-800">
          <Lock className="w-5 h-5 text-green-500" />
          <div className="flex flex-row items-center gap-2 w-full">
            <span className="text-sm text-gray-600 dark:text-gray-300">CPF:</span>
            <input
              type="text"
              name="cpf"
              className="bg-transparent outline-none border-none text-black dark:text-white placeholder:text-gray-400 w-full"
              value={cpf}
              onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
              maxLength={11} // opcional, limite de 11 dígitos
              placeholder="Digite seu CPF"
              required
            />
          </div>
        </label>
        <span className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
          Ao solicitar a chave, você concorda com os <a href="https://www.intelbras.com/pt-br/politica-de-privacidade/termos" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">Termos de Uso</a> e a <a href="https://www.intelbras.com/pt-br/politica-de-privacidade/politica" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">Política de Privacidade</a>.
        </span>

        <button 
          disabled={loading}
          className="flex items-center justify-center bg-green-500 text-white p-2 rounded-md w-full hover:bg-green-600 transition cursor-pointer">
            {loading ? <Loader className="animate-spin w-5 h-5" /> : 'Solicitar Chave'}
        </button>
      </form>

      
     
    </div>
    
    </div>
  )
}