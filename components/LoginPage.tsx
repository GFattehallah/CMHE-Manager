
import React, { useState } from 'react';
import { Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';
import { AuthService } from '../services/authService';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await AuthService.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side - Brand */}
        <div className="bg-medical-600 p-12 flex flex-col justify-between text-white md:w-5/12">
          <div>
            {/* Logo Section */}
            <div className="mb-8 flex justify-center md:justify-start">
              <div className="bg-white p-3 rounded-2xl shadow-lg inline-block">
                {/* Assurez-vous d'avoir placé le fichier 'logo.png' dans le dossier public/ de votre projet */}
                <img 
                  src="/logo.png" 
                  alt="CMHE Logo" 
                  className="w-24 h-24 object-contain"
                  onError={(e) => {
                    // Fallback si l'image n'existe pas
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                {/* Fallback Text if image fails to load */}
                <span className="hidden text-medical-600 font-bold text-2xl">CMHE</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">CMHE Manager</h1>
            <p className="text-medical-100">Système de gestion médicale sécurisé et intelligent.</p>
          </div>
          <div className="mt-8 text-sm text-medical-200">
            &copy; 2025 Cabinet Médical Dr. Hasnaa El Malki
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:p-12 md:w-7/12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Connexion</h2>
            <p className="text-slate-500 mt-1">Accédez à votre espace de travail sécurisé</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email professionnel</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500 outline-none transition"
                  placeholder="nom@cmhe.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500 outline-none transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
              {!isLoading && <ChevronRight size={18} />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
             <p>Comptes de test:</p>
             <p>Admin: admin@cmhe.ma / admin123</p>
             <p>Secrétaire: secretaire@cmhe.ma / sec123</p>
          </div>
        </div>
      </div>
    </div>
  );
};
