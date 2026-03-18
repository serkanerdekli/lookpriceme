import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import Logo from "../components/Logo";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";
import { User } from "../types";

interface LoginPageProps {
  onLogin: (token: string, user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post("/api/auth/login", { email, password });
    if (res.token) {
      onLogin(res.token, res.user);
    } else {
      setError(res.error || "Login failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={64} className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">{t.loginTitle}</h2>
          <p className="mt-2 text-gray-600">{lang === 'tr' ? 'Mağazanızı yönetmek için giriş yapın' : 'Login to manage your store'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center text-sm">
              <AlertCircle className="h-4 w-4 mr-2" /> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">{t.email}</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t.password}</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
            <div className="mt-2 text-right">
              <button 
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                {t.forgotPassword}
              </button>
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            {t.loginTitle}
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t.noAccount}{" "}
              <button 
                type="button"
                onClick={() => navigate("/", { state: { openDemo: true } })}
                className="text-indigo-600 font-bold hover:underline"
              >
                {t.registerTitle}
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
