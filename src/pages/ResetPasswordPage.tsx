import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Logo from "../components/Logo";
import { api } from "../services/api";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Şifreler eşleşmiyor");
    }
    setLoading(true);
    setError("");
    const res = await api.post("/api/auth/reset-password", { token, newPassword: password });
    setLoading(false);
    if (res.success) {
      setMessage("Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.");
      setTimeout(() => navigate("/login"), 3000);
    } else {
      setError(res.error || "İşlem başarısız");
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
          <h2 className="text-3xl font-extrabold text-gray-900">Yeni Şifre Oluştur</h2>
          <p className="mt-2 text-gray-600">Lütfen yeni şifrenizi belirleyin.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center text-sm">
              <AlertCircle className="h-4 w-4 mr-2" /> {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg flex items-center text-sm">
              <CheckCircle2 className="h-4 w-4 mr-2" /> {message}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Yeni Şifre</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Şifre Tekrar</label>
            <input 
              type="password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
