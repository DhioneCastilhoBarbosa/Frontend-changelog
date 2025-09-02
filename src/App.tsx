import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import Header from "./components/header";
import SignIn from "./components/singin";
import SignUp from "./components/signUp"; // supondo que existe
import Dashboard from "./components/dashboard/dashboard";

import { Toaster } from "sonner";

import "./global.css";
import RequestKey from "./components/requestKey";
import PrivateRoute from "./routes/PrivateRoute";
import CreateReleaseModal from "./components/register/registerRelease";

export default function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPage, setIspage] = useState("dashboard");

  useEffect(() => {
    const authenticated = localStorage.getItem("authenticated");
    const expires = localStorage.getItem("expires_at");
    const now = Date.now();
    const expiration = expires ? parseInt(expires, 10) : 0;

    if (authenticated === "true" && expiration > now) {
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("authenticated");
      localStorage.removeItem("expires_at");
      localStorage.removeItem("token"); // importante também
    }

    // ✅ Finaliza o carregamento depois da verificação
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    const expiresAt = Date.now() + 60 * 60 * 1000; // 60 minutos
    localStorage.setItem("authenticated", "true");
    localStorage.setItem("expires_at", expiresAt.toString());
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("authenticated");
    localStorage.removeItem("expires_at");
    localStorage.removeItem("token");
    setIspage("dashboard");
    setIsAuthenticated(false);
    navigate("/login", { replace: true }); // força ir para login
  };

  const handleLicenca = () => {
    setIspage("dashboard");
  };
  const handleChave = () => {
    setIspage("key");
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-black dark:text-white">
        Carregando...
      </div>
    );
  }

  return (
    <>
      <div className="h-screen flex flex-col bg-white text-black dark:bg-zinc-900 dark:text-white overflow-hidden">
        <Routes>
          {/* Primeira rota de acesso → /solicitar-chave */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Públicas */}
          <Route path="/solicitar-chave" element={<RequestKey />} />
          <Route path="/login" element={<SignIn onLogin={handleLogin} />} />
          <Route path="/cadastro" element={<SignUp />} />

          {/* Protegida */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <>
                  <header className="w-full">
                    <Header
                      LogOut={handleLogout}
                      LogKey={handleChave}
                      LogLicense={handleLicenca}
                    />
                  </header>
                  <main className="flex-1 h-screen overflow-auto">
                    {isPage === "dashboard" ? (
                      <Dashboard />
                    ) : (
                      <CreateReleaseModal />
                    )}
                  </main>
                </>
              </PrivateRoute>
            }
          />

          {/* Qualquer outra rota → /solicitar-chave */}
          <Route
            path="*"
            element={<Navigate to="/solicitar-chave" replace />}
          />
        </Routes>
      </div>

      <Toaster richColors position="top-right" />
    </>
  );
}
