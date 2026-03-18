import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";
import { User } from "./types";

// Components
import Navbar from "./components/Navbar";
import { LandingPage } from "./components/LandingPage";

// Pages
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CustomerScanPage from "./pages/CustomerScanPage";
import StoreDashboard from "./pages/StoreDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

export default function App() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  useEffect(() => {
    document.title = translations[lang].meta.title;
    document.documentElement.lang = lang;
  }, [lang]);

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("token");
    } catch (e) {
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
      return null;
    }
  });

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    
    // Redirect based on role and store
    if (newUser.role === 'superadmin') {
      navigate("/admin");
    } else if (newUser.store_slug) {
      navigate(`/dashboard/${newUser.store_slug}`);
    } else {
      navigate("/dashboard");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Routes>
        {/* Public Routes */}
        <Route path="/scan/:slug" element={<CustomerScanPage />} />
        <Route path="/forgot-password" element={
          <>
            <Navbar user={null} onLogout={handleLogout} />
            <ForgotPasswordPage />
          </>
        } />
        <Route path="/reset-password/:token" element={
          <>
            <Navbar user={null} onLogout={handleLogout} />
            <ResetPasswordPage />
          </>
        } />
        
        {/* Auth Routes */}
        <Route path="/login" element={
          token ? (
            user?.role === 'superadmin' ? <Navigate to="/admin" /> : 
            user?.store_slug ? <Navigate to={`/dashboard/${user.store_slug}`} /> : <Navigate to="/dashboard" />
          ) : (
            <>
              <Navbar user={null} onLogout={handleLogout} />
              <LoginPage onLogin={handleLogin} />
            </>
          )
        } />

        {/* Protected Routes */}
        <Route path="/dashboard/:slug?" element={
          token && user ? (
            <>
              <Navbar user={user} onLogout={handleLogout} />
              <StoreDashboard user={user} onLogout={handleLogout} />
            </>
          ) : <Navigate to="/login" />
        } />

        <Route path="/admin" element={
          token && user?.role === 'superadmin' ? (
            <>
              <Navbar user={user} onLogout={handleLogout} />
              <SuperAdminDashboard token={token} />
            </>
          ) : <Navigate to="/login" />
        } />

        <Route path="/" element={
          <>
            <Navbar user={token ? user : null} onLogout={handleLogout} />
            <LandingPage />
          </>
        } />
      </Routes>
    </div>
  );
}
