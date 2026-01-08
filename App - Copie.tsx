import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Stethoscope, FileText, 
  LogOut, Menu, X, ScrollText, Banknote, FileSpreadsheet, Shield
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { PatientManager } from './components/PatientManager';
import { ConsultationManager } from './components/ConsultationManager';
import { AppointmentManager } from './components/AppointmentManager';
import { PrescriptionManager } from './components/PrescriptionManager';
import { BillingManager } from './components/BillingManager';
import { FinanceManager } from './components/FinanceManager';
import { AccountManager } from './components/AccountManager';
import { ImportPatients } from './components/ImportPatients';
import { LoginPage } from './components/LoginPage';
import { AuthService } from './services/authService';
import { User, Permission } from './types';

const SidebarItem = ({ icon: Icon, label, path, active }: any) => (
  <Link 
    to={path} 
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-medical-50 text-medical-700 font-medium' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span>{label}</span>
  </Link>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(AuthService.getCurrentUser());

  const handleLogin = (u: User) => {
    setUser(u);
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <MainLayout user={user} onLogout={handleLogout} />
    </Router>
  );
};

const MainLayout: React.FC<{user: User, onLogout: () => void}> = ({ user, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { label: 'Tableau de bord', icon: LayoutDashboard, path: '/', permission: Permission.DASHBOARD },
    { label: 'Patients', icon: Users, path: '/patients', permission: Permission.PATIENTS },
    { label: 'Importation Excel', icon: FileSpreadsheet, path: '/import-patients', permission: Permission.IMPORT },
    { label: 'Agenda', icon: Calendar, path: '/agenda', permission: Permission.AGENDA },
    { label: 'Consultations', icon: Stethoscope, path: '/consultations', permission: Permission.CONSULTATIONS },
    { label: 'Ordonnances', icon: ScrollText, path: '/prescriptions', permission: Permission.PRESCRIPTIONS },
    { label: 'Facturation & CNSS', icon: FileText, path: '/billing', permission: Permission.BILLING },
    { label: 'Dépenses & Recettes', icon: Banknote, path: '/finance', permission: Permission.FINANCE },
    { label: 'Gestion Comptes', icon: Shield, path: '/users', permission: Permission.USERS },
  ];

  // Filtrer les items de navigation basés sur les permissions de l'utilisateur
  const visibleNavItems = navItems.filter(item => user.permissions.includes(item.permission));

  // Protection d'accès dynamique
  const currentNavItem = navItems.find(item => item.path === location.pathname);
  if (currentNavItem && !user.permissions.includes(currentNavItem.permission)) {
    // Rediriger vers le premier item autorisé si accès refusé
    return <Navigate to={visibleNavItems[0]?.path || '/patients'} replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside 
        className={`bg-white border-r border-slate-200 fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20 lg:hover:w-64 group'
        } no-print`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="w-8 h-8 bg-medical-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3">C</div>
            <span className={`font-bold text-xl text-slate-800 ${!isSidebarOpen && 'lg:hidden group-hover:block'}`}>
              CMHE Mgr
            </span>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {visibleNavItems.map((item) => (
              <SidebarItem key={item.path} {...item} active={location.pathname === item.path} />
            ))}
          </nav>
          <div className="p-4 border-t border-slate-100">
            <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition">
              <LogOut size={20} />
              <span className={`${!isSidebarOpen && 'lg:hidden group-hover:block'}`}>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 no-print">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-500">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500 italic">{user.role}</p>
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm">
              {user.avatar || 'U'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<PatientManager />} />
            <Route path="/import-patients" element={<ImportPatients />} />
            <Route path="/consultations" element={<ConsultationManager />} />
            <Route path="/agenda" element={<AppointmentManager />} />
            <Route path="/prescriptions" element={<PrescriptionManager />} />
            <Route path="/billing" element={<BillingManager />} />
            <Route path="/finance" element={<FinanceManager />} />
            <Route path="/users" element={<AccountManager />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/20 z-40 lg:hidden" />}
    </div>
  );
};

export default App;
