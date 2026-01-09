
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Users, CreditCard, Calendar as CalIcon, Activity, Clock, Plus, 
  FileText, TrendingUp, AlertCircle, Download, Database, Pill, FileSpreadsheet,
  Table as TableIcon, TrendingDown, ChevronRight, PieChart as PieIcon, Filter, Banknote, Coins, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import { AppointmentStatus, EXPENSE_CATEGORIES, Permission, Patient, Appointment, Invoice, Role } from '../types';

export const Dashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = AuthService.getCurrentUser();
  const isAdmin = currentUser?.role === Role.ADMIN;
  const canSeeStats = currentUser?.permissions.includes(Permission.STATS) || isAdmin;

  const [chartPeriod, setChartPeriod] = useState<'6m' | '1y'>('6m');

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      const [p, a, i] = await Promise.all([
        DataService.getPatients(),
        DataService.getAppointments(),
        DataService.getInvoices()
      ]);
      setPatients(p);
      setAppointments(a);
      setInvoices(i);
      setIsLoading(false);
    };
    loadAll();
  }, []);

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const todayAppointmentsList = appointments
    .filter(a => a.date.startsWith(today) && a.status !== AppointmentStatus.CANCELLED)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const todayRevenue = invoices
    .filter(i => i.date.startsWith(today) && i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0);

  const monthRevenue = invoices
    .filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && i.status === 'PAID';
    })
    .reduce((sum, i) => sum + i.amount, 0);

  const yearRevenue = invoices
    .filter(i => {
      const d = new Date(i.date);
      return d.getFullYear() === currentYear && i.status === 'PAID';
    })
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingPayments = invoices
    .filter(i => i.status === 'PENDING')
    .reduce((sum, i) => sum + i.amount, 0);

  const formatMAD = (val: number) => val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const revenueData = useMemo(() => {
    const monthsToShow = chartPeriod === '6m' ? 6 : 12;
    const monthly: Record<string, number> = {};
    for(let i = monthsToShow - 1; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const key = d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
        monthly[key] = 0;
    }
    invoices.filter(inv => inv.status === 'PAID').forEach(inv => {
      const month = new Date(inv.date).toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
      if (monthly.hasOwnProperty(month)) monthly[month] += inv.amount;
    });
    return Object.keys(monthly).map(key => ({ name: key, CA: Number(monthly[key].toFixed(2)) }));
  }, [invoices, chartPeriod]);

  const getPatientName = (id: string) => {
    const p = patients.find(pat => pat.id === id);
    return p ? `${p.lastName} ${p.firstName}` : 'Inconnu';
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-medical-600 animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronisation Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Tableau de Bord</h1>
          <p className="text-slate-500 font-medium">Cabinet Médical CMHE • Ait Melloul</p>
        </div>

        {/* RACCOURCI MAINTENANCE POUR ADMIN */}
        {isAdmin && (
          <Link to="/maintenance" className="bg-slate-800 text-white px-5 py-3 rounded-2xl flex items-center gap-3 hover:bg-slate-700 transition shadow-lg shadow-slate-100 group">
             <Database size={20} className="text-slate-400 group-hover:text-white transition-colors"/>
             <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Système</span>
                <span className="text-xs font-bold">Migration & Backup</span>
             </div>
             <ChevronRight size={16} className="ml-2 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {canSeeStats && (
            <KpiCard 
              title="CA Mensuel" 
              value={`${formatMAD(monthRevenue)} MAD`} 
              icon={TrendingUp} 
              color="bg-emerald-100 text-emerald-600" 
              subtext={`Aujourd'hui: ${formatMAD(todayRevenue)} MAD`} 
            />
        )}
        {canSeeStats && (
            <KpiCard 
              title="CA Annuel" 
              value={`${formatMAD(yearRevenue)} MAD`} 
              icon={Banknote} 
              color="bg-indigo-100 text-indigo-600" 
              subtext={`Année ${currentYear}`} 
            />
        )}
        <KpiCard 
          title="RDV du jour" 
          value={todayAppointmentsList.length.toString()} 
          icon={CalIcon} 
          color="bg-blue-100 text-blue-600" 
          subtext="Consultations prévues" 
        />
        <KpiCard 
          title="Total Patients" 
          value={patients.length.toString()} 
          icon={Users} 
          color="bg-amber-100 text-amber-600" 
          subtext="Dossiers enregistrés" 
        />
      </div>

      <div className={`grid grid-cols-1 ${canSeeStats ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
        {canSeeStats && (
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Activity size={20} className="text-medical-600"/> Évolution du CA (MAD)</h3>
                    <select 
                        className="text-xs font-bold bg-slate-50 border-none rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                        value={chartPeriod}
                        onChange={(e) => setChartPeriod(e.target.value as any)}
                    >
                        <option value="6m">6 derniers mois</option>
                        <option value="1y">12 derniers mois</option>
                    </select>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                            <defs><linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`${formatMAD(value)} MAD`, 'CA']}
                            />
                            <Area type="monotone" dataKey="CA" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorCA)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        <div className={`${canSeeStats ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 border border-slate-200'} p-8 rounded-[40px] shadow-xl relative overflow-hidden group`}>
            {canSeeStats && (
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                    <Coins size={120} />
                </div>
            )}
            <h3 className={`text-xs font-black uppercase tracking-[0.3em] ${canSeeStats ? 'text-slate-400' : 'text-slate-500'} mb-6 flex items-center justify-between relative z-10`}>
                {canSeeStats ? 'Recettes Récentes' : 'RDV du Jour'} <ChevronRight size={18}/>
            </h3>
            <div className="space-y-6 relative z-10">
                {canSeeStats ? (
                    invoices.filter(i => i.status === 'PAID').slice(0, 5).map(inv => (
                        <div key={inv.id} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0">
                            <div>
                                <p className="text-sm font-bold truncate max-w-[150px]">{getPatientName(inv.patientId)}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{new Date(inv.date).toLocaleDateString('fr-FR')}</p>
                            </div>
                            <span className="font-black text-lg text-emerald-400 tabular-nums">{formatMAD(inv.amount)} <span className="text-xs font-bold">MAD</span></span>
                        </div>
                    ))
                ) : (
                    todayAppointmentsList.slice(0, 5).map(apt => (
                        <div key={apt.id} className="flex justify-between items-center border-b border-slate-100 pb-4 last:border-0">
                            <div>
                                <p className="text-sm font-bold truncate max-w-[150px]">{getPatientName(apt.patientId)}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{new Date(apt.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</p>
                            </div>
                            <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-tighter">RDV</span>
                        </div>
                    ))
                )}
            </div>
            {canSeeStats && (
                <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-widest">Impayés clients</span>
                        <span className="text-rose-400 font-black">{formatMAD(pendingPayments)} MAD</span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-start justify-between group transition-all hover:shadow-md hover:border-slate-200">
        <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">{title}</p>
            <p className="text-2xl font-black text-slate-800 tabular-nums">{value}</p>
            {subtext && (
                <div className="mt-4 flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${color.split(' ')[0]}`}></div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{subtext}</p>
                </div>
            )}
        </div>
        <div className={`p-4 rounded-2xl ${color} shadow-sm group-hover:scale-110 transition-all`}>
            <Icon size={24} />
        </div>
    </div>
);
