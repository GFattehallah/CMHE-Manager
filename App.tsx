
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Stethoscope, FileText, 
  LogOut, Menu, X, ScrollText, Banknote, FileSpreadsheet, Shield, UserCircle, Database,
  Cloud, CloudOff, RefreshCw
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { PatientManager } from './components/PatientManager';
import { PatientDMP } from './components/PatientDMP';
import { ConsultationManager } from './components/ConsultationManager';
import { AppointmentManager } from './components/AppointmentManager';
import { PrescriptionManager } from './components/PrescriptionManager';
import { BillingManager } from './components/BillingManager';
import { FinanceManager } from './components/FinanceManager';
import { AccountManager } from './components/AccountManager';
import { ImportPatients } from './components/ImportPatients';
import { MaintenanceManager } from './components/MaintenanceManager';
import { LoginPage } from './components/LoginPage';
import { AuthService } from './services/authService';
import { isSupabaseConfigured } from './services/supabase';
import { User, Permission, Role } from './types';

const SidebarItem = ({ icon: Icon, label, path, active }: any) => (
  <Link 
    to={path} 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-medical-600 text-white font-bold shadow-lg shadow-medical-100' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="text-sm tracking-tight">{label}</span>
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

  return (
    <Router>
      {!user ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <MainLayout user={user} onLogout={handleLogout} />
      )}
    </Router>
  );
};

const MainLayout: React.FC<{user: User, onLogout: () => void}> = ({ user, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const isCloud = isSupabaseConfigured();
  const location = useLocation();

  const navItems = [
    { label: 'Tableau de bord', icon: LayoutDashboard, path: '/', permission: Permission.DASHBOARD },
    { label: 'Dossiers Médicaux (DMP)', icon: UserCircle, path: '/patients', permission: Permission.DMP_VIEW },
    { label: 'Agenda & RDV', icon: Calendar, path: '/agenda', permission: Permission.AGENDA },
    { label: 'Consultations', icon: Stethoscope, path: '/consultations', permission: Permission.CONSULTATIONS },
    { label: 'Ordonnances', icon: ScrollText, path: '/prescriptions', permission: Permission.PRESCRIPTIONS },
    { label: 'Facturation & Honoraires', icon: FileText, path: '/billing', permission: Permission.BILLING },
    { label: 'Trésorerie & Finance', icon: Banknote, path: '/finance', permission: Permission.FINANCE },
    { label: 'Importation Patients', icon: FileSpreadsheet, path: '/import-patients', permission: Permission.IMPORT },
    { label: 'Gestion du Personnel', icon: Shield, path: '/users', permission: Permission.USERS },
    { label: 'Migration & Backup', icon: Database, path: '/maintenance', permission: Permission.USERS },
  ];

  const userPermissions = user.permissions || [];
  const isAdmin = user.role === Role.ADMIN;
  const isDoc = user.role === Role.DOCTOR;

  const visibleNavItems = navItems.filter(item => {
    if (isAdmin) return true;
    if (item.permission === Permission.DMP_VIEW && (isAdmin || isDoc)) return true;
    return userPermissions.includes(item.permission);
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside 
        className={`bg-white border-r border-slate-200 fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20 lg:hover:w-72 group'
        } no-print`}
      >
        <div className="h-full flex flex-col">
          <div className="h-20 flex items-center px-6 border-b border-slate-100">
            <div className="w-10 h-10 bg-medical-600 rounded-xl flex items-center justify-center text-white font-black text-xl mr-3 shadow-md">C</div>
            <div className={`flex flex-col ${!isSidebarOpen && 'lg:hidden group-hover:flex'}`}>
              <span className="font-black text-lg text-slate-800 tracking-tighter uppercase leading-tight">CMHE Mgr</span>
              <div className="flex items-center gap-1.5">
                {isCloud ? (
                  <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest"><Cloud size={8}/> Cloud Sync</span>
                ) : (
                  <span className="flex items-center gap-1 text-[8px] font-black text-amber-500 uppercase tracking-widest"><CloudOff size={8}/> Local Mode</span>
                )}
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {visibleNavItems.map((item, idx) => (
              <SidebarItem key={`${item.path}-${idx}`} {...item} active={location.pathname === item.path} />
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className={`mb-4 p-3 bg-slate-50 rounded-2xl flex items-center gap-3 ${!isSidebarOpen && 'lg:hidden group-hover:flex'}`}>
               <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-xs uppercase">
                 {user.name[0]}
               </div>
               <div className="flex flex-col">
                 <span className="text-xs font-bold text-slate-800 truncate w-32">{user.name}</span>
                 <span className="text-[9px] font-bold text-slate-400 uppercase">{user.role}</span>
               </div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all font-bold text-sm">
              <LogOut size={20} />
              <span className={`${!isSidebarOpen && 'lg:hidden group-hover:block'}`}>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 no-print lg:hidden">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-500">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
          <span className="font-black text-slate-800">CMHE</span>
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            {isCloud ? <Cloud size={16} className="text-emerald-500"/> : <CloudOff size={16} className="text-amber-500"/>}
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<PatientManager />} />
            <Route path="/dmp/:patientId" element={<PatientDMP />} />
            <Route path="/import-patients" element={<ImportPatients />} />
            <Route path="/consultations" element={<ConsultationManager />} />
            <Route path="/agenda" element={<AppointmentManager />} />
            <Route path="/prescriptions" element={<PrescriptionManager />} />
            <Route path="/billing" element={<BillingManager />} />
            <Route path="/finance" element={<FinanceManager />} />
            <Route path="/users" element={<AccountManager />} />
            <Route path="/maintenance" element={<MaintenanceManager />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/20 z-40 lg:hidden" />}
    </div>
  );
};

export default App;
