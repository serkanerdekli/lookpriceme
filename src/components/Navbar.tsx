import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./Logo";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";
import { User } from "../types";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar = ({ user, onLogout }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang].nav;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
            <Logo size={32} className="text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">Look<span className="text-indigo-600">Price</span></span>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {!user && (
              <button 
                onClick={() => navigate("/login")}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                {t.login}
              </button>
            )}
            {user && (
              <>
                <span className="text-sm text-gray-500">{user.email}</span>
                <button 
                  onClick={onLogout}
                  className="flex items-center text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-4 w-4 mr-1" /> {t.logout}
                </button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-3 space-y-1"
          >
            {!user && (
              <button 
                onClick={() => {
                  navigate("/login");
                  setIsOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-indigo-600 font-bold"
              >
                Giriş Yap
              </button>
            )}
            {user && (
              <button 
                onClick={onLogout}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-indigo-600"
              >
                Logout
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
