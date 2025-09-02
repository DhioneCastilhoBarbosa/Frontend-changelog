import { Moon, SunIcon, Menu, X, ClipboardList } from "lucide-react";
import { useLayoutEffect, useState } from "react";

interface HeaderProps {
  LogOut: () => void;
  LogLicense: () => void;
  LogKey: () => void;
}

export default function Header({ LogOut, LogLicense, LogKey }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [buttonActive, setButtonActive] = useState<"Listar" | "Cadastrar">(
    "Listar"
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  const handleLicenca = () => {
    setButtonActive("Listar");
    LogLicense();
    setIsMobileMenuOpen(false);
  };

  const handleChave = () => {
    setButtonActive("Cadastrar");
    LogKey();
    setIsMobileMenuOpen(false);
  };

  const handleSubmit = () => {
    setIsMobileMenuOpen(false);
    setButtonActive("Listar");
    LogOut();
  };

  return (
    <header className="w-full relative flex justify-between items-center transition-colors duration-300 bg-white text-black dark:bg-zinc-800 dark:text-white border-b-2 border-green-300 p-4">
      <div className="flex items-center gap-2">
        <ClipboardList size={24} />
        <span className="text-2xl md:border-r-2 md:border-black pr-2 dark:border-white">
          ChangeLog - CVE
        </span>

        {/* Menu desktop */}
        <div className="hidden lg:flex gap-2 ml-4">
          <button
            onClick={handleLicenca}
            className={`p-2 rounded-md text-sm hover:font-medium hover:bg-zinc-100 dark:hover:bg-zinc-400/10 ${
              buttonActive === "Listar" ? "bg-zinc-200 dark:bg-zinc-400/10" : ""
            }`}
          >
            Listar
          </button>
          <button
            onClick={handleChave}
            className={`p-2 rounded-md text-sm hover:font-medium hover:bg-zinc-100 dark:hover:bg-zinc-400/10 ${
              buttonActive === "Cadastrar"
                ? "bg-zinc-200 dark:bg-zinc-400/10"
                : ""
            }`}
          >
            Cadastrar
          </button>
        </div>
      </div>

      {/* Ações desktop */}
      <div className="hidden lg:flex items-center gap-4">
        <button onClick={() => setIsDark(!isDark)}>
          {isDark ? <SunIcon /> : <Moon />}
        </button>
        <button onClick={handleSubmit}>Sair</button>
      </div>

      {/* Botão de menu mobile */}
      <div className="lg:hidden">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Menu Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full flex flex-col gap-2 bg-white dark:bg-zinc-800 p-4 border-t border-zinc-300 dark:border-zinc-600 z-50">
          <button
            onClick={handleLicenca}
            className={`rounded-md p-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-400/10 ${
              buttonActive === "Listar" ? "bg-zinc-200 dark:bg-zinc-400/10" : ""
            }`}
          >
            Listar
          </button>
          <button
            onClick={handleChave}
            className={`rounded-md p-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-400/10 ${
              buttonActive === "Cadastrar"
                ? "bg-zinc-200 dark:bg-zinc-400/10"
                : ""
            }`}
          >
            Cadastrar
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            className="rounded-md p-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-400/10"
          >
            {isDark ? (
              <span className="flex items-center gap-2">
                Modo Claro
                <SunIcon size={16} />
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Modo Escuro
                <Moon size={16} />
              </span>
            )}
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-md p-2 text-left hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-300"
          >
            Sair
          </button>
        </div>
      )}
    </header>
  );
}
