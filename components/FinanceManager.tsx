
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Banknote, TrendingDown, TrendingUp, Plus, Calendar, 
  Trash2, PieChart as PieIcon, BarChart3, Filter, Coins, Receipt, Users, PlusCircle,
  Download, FileSpreadsheet, ChevronRight, Upload, CheckCircle2, AlertCircle, X, Info,
  CheckSquare, Square, MinusSquare, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { DataService } from '../services/dataService';
import { Expense, Invoice, ExpenseCategory, EXPENSE_CATEGORIES, PaymentType, Patient } from '../types';

const CATEGORY_COLORS = {
  FIXED: '#3b82f6',    
  CONSUMABLE: '#f59e0b', 
  SALARY: '#10b981',   
  EQUIPMENT: '#8b5cf6', 
  TAX: '#ef4444',      
  OTHER: '#64748b'     
};

export const FinanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'revenues'>('overview');
  const [viewType, setViewType] = useState<'day' | 'month' | 'year'>('month');
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<'EXPENSE' | 'REVENUE'>('EXPENSE');
  
  const [filterDay, setFilterDay] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const openImportModal = (type: 'EXPENSE' | 'REVENUE') => {
    setImportType(type);
    setIsImportModalOpen(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, filterMonth, filterYear, viewType, filterDay]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [exp, inv, pat] = await Promise.all([
        DataService.getExpenses(),
        DataService.getInvoices(),
        DataService.getPatients()
      ]);
      setExpenses(exp);
      setInvoices(inv);
      setPatients(pat);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPatientName = (id: string) => {
    const p = patients.find(pat => pat.id === id);
    return p ? `${p.lastName} ${p.firstName}` : 'Recette Divers';
  };

  const formatMAD = (val: number) => val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const currentPeriodData = useMemo(() => {
    const filteredExp = expenses.filter(e => {
      const d = new Date(e.date);
      if (viewType === 'day') return e.date.startsWith(filterDay);
      const yearMatch = d.getFullYear() === filterYear;
      const monthMatch = viewType === 'year' ? true : d.getMonth() === filterMonth;
      return yearMatch && monthMatch;
    });

    const filteredInv = invoices.filter(i => {
      const d = new Date(i.date);
      if (i.status !== 'PAID') return false;
      if (viewType === 'day') return i.date.startsWith(filterDay);
      const yearMatch = d.getFullYear() === filterYear;
      const monthMatch = viewType === 'year' ? true : d.getMonth() === filterMonth;
      return yearMatch && monthMatch;
    });

    return { expenses: filteredExp, invoices: filteredInv };
  }, [expenses, invoices, filterDay, filterMonth, filterYear, viewType]);

  const totalIncome = currentPeriodData.invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = currentPeriodData.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netResult = totalIncome - totalExpense;

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (items: (Expense | Invoice)[]) => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const handleDeleteBulk = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedIds.length === 0) return;
    if (window.confirm(`Supprimer définitivement ${selectedIds.length} éléments sélectionnés ?`)) {
      setIsRefreshing(true);
      try {
        const idsToRemove = [...selectedIds];
        setSelectedIds([]);
        if (activeTab === 'expenses') await DataService.deleteExpensesBulk(idsToRemove);
        else if (activeTab === 'revenues') await DataService.deleteInvoicesBulk(idsToRemove);
        await loadData();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm("Supprimer cette dépense ?")) {
      setIsRefreshing(true);
      try { await DataService.deleteExpense(id); await loadData(); } finally { setIsRefreshing(false); }
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    if (window.confirm("Supprimer cet encaissement ?")) {
      setIsRefreshing(true);
      try { await DataService.deleteInvoice(id); await loadData(); } finally { setIsRefreshing(false); }
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const formatInvoices = (data: Invoice[]) => data.map(inv => ({
      'Date': new Date(inv.date).toLocaleDateString('fr-FR'),
      'Patient': getPatientName(inv.patientId),
      'Motif': inv.items?.[0]?.description || 'Recette',
      'Mode de Paiement': inv.paymentMethod,
      'Montant (MAD)': inv.amount
    }));
    const formatExpenses = (data: Expense[]) => data.map(exp => ({
      'Date': new Date(exp.date).toLocaleDateString('fr-FR'),
      'Catégorie': EXPENSE_CATEGORIES[exp.category],
      'Désignation': exp.description,
      'Mode de Paiement': exp.paymentMethod,
      'Montant (MAD)': exp.amount
    }));
    if (activeTab === 'overview' || activeTab === 'revenues') {
      const wsRev = XLSX.utils.json_to_sheet(formatInvoices(currentPeriodData.invoices));
      XLSX.utils.book_append_sheet(wb, wsRev, 'Recettes');
    }
    if (activeTab === 'overview' || activeTab === 'expenses') {
      const wsExp = XLSX.utils.json_to_sheet(formatExpenses(currentPeriodData.expenses));
      XLSX.utils.book_append_sheet(wb, wsExp, 'Dépenses');
    }
    XLSX.writeFile(wb, `Finance_Cabinet_${filterYear}.xlsx`);
  };

  const annualChartData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const monthInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === i && d.getFullYear() === filterYear && inv.status === 'PAID';
      });
      const monthExpenses = expenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === i && d.getFullYear() === filterYear;
      });
      const inc = monthInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const exp = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        name: new Date(0, i).toLocaleString('fr-FR', { month: 'short' }),
        Encaissements: Number(inc.toFixed(2)),
        Décaissements: Number(exp.toFixed(2))
      };
    });
  }, [invoices, expenses, filterYear]);

  const expenseByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    currentPeriodData.expenses.forEach(e => {
      data[e.category] = (data[e.category] || 0) + e.amount;
    });
    return Object.keys(data).map(key => ({
      name: EXPENSE_CATEGORIES[key as ExpenseCategory],
      value: Number(data[key].toFixed(2)),
      key: key
    }));
  }, [currentPeriodData.expenses]);

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-slate-50 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-xl text-white"><Banknote size={24} /></div>
             Trésorerie & Finance
          </h1>
          <p className="text-slate-500 font-medium ml-1 flex items-center gap-2">Flux de trésorerie du cabinet {isRefreshing && <RefreshCw size={14} className="animate-spin text-indigo-500" />}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 font-bold shadow-sm transition-all"><FileSpreadsheet size={18} /> Exporter</button>
          <div className="h-10 w-px bg-slate-200 mx-1 hidden md:block"></div>
          <button onClick={() => setIsRevenueModalOpen(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition active:scale-95 font-bold"><TrendingUp size={20}/> <span className="hidden sm:inline">Recette</span></button>
          <button onClick={() => setIsExpenseModalOpen(true)} className="bg-rose-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-rose-100 hover:bg-rose-700 transition active:scale-95 font-bold"><TrendingDown size={20}/> <span className="hidden sm:inline">Dépense</span></button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-center justify-between bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-auto">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Vue d'ensemble</button>
          <button onClick={() => setActiveTab('revenues')} className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'revenues' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Recettes Cash</button>
          <button onClick={() => setActiveTab('expenses')} className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'expenses' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Dépenses</button>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto px-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['day', 'month', 'year'].map(vt => (
              <button key={vt} onClick={() => setViewType(vt as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${viewType === vt ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{vt === 'day' ? 'Jour' : vt === 'month' ? 'Mois' : 'Année'}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {viewType === 'day' && <input type="date" value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className="bg-transparent text-sm font-black text-slate-700 outline-none"/>}
            {viewType === 'month' && <select value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))} className="bg-transparent text-sm font-black text-slate-700 outline-none">{Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}</option>)}</select>}
            <select value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))} className="bg-transparent text-sm font-black text-slate-700 outline-none border-l pl-2 border-slate-200">{[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 scroll-smooth pb-24 relative z-10">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in pb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Recettes</p><p className="text-3xl font-black text-emerald-600 tabular-nums">{formatMAD(totalIncome)} <span className="text-sm">MAD</span></p></div><div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp size={28}/></div></div>
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Dépenses</p><p className="text-3xl font-black text-rose-600 tabular-nums">{formatMAD(totalExpense)} <span className="text-sm">MAD</span></p></div><div className="p-4 bg-rose-50 rounded-2xl text-rose-600"><TrendingDown size={28}/></div></div>
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-md flex items-center justify-between bg-gradient-to-br from-white to-slate-50"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bénéfice Net</p><p className={`text-3xl font-black tabular-nums ${netResult >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>{formatMAD(netResult)} <span className="text-sm">MAD</span></p></div><div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600"><Coins size={28}/></div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-[450px]"><h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-lg mb-8"><BarChart3 size={20} className="text-indigo-600"/> Flux ({filterYear})</h3><div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={annualChartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }}/><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }}/><RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/><Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}/><Bar dataKey="Encaissements" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} /><Bar dataKey="Décaissements" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} /></BarChart></ResponsiveContainer></div></div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-[450px]"><h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-lg mb-8"><PieIcon size={20} className="text-orange-500"/> Dépenses</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">{expenseByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={(CATEGORY_COLORS as any)[entry.key] || '#cbd5e1'} />)}</Pie><RechartsTooltip /></PieChart></ResponsiveContainer></div></div>
            </div>
          </div>
        )}

        {activeTab === 'revenues' && (
          <div className="space-y-4 animate-fade-in">
             <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm"><p className="text-xs font-bold text-slate-500 flex items-center gap-2"><Info size={14}/> {viewType === 'day' ? `Recettes du ${new Date(filterDay).toLocaleDateString('fr-FR')}` : `Recettes sélectionnées`}</p><button onClick={() => openImportModal('REVENUE')} className="bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-black transition-all"><Upload size={14}/> Importer Recettes</button></div>
             <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><tr><th className="p-5 pl-8 w-10"><button onClick={() => handleSelectAll(currentPeriodData.invoices)} className="text-slate-400 hover:text-indigo-600 transition">{selectedIds.length === currentPeriodData.invoices.length && currentPeriodData.invoices.length > 0 ? <CheckSquare size={18} className="text-indigo-600" /> : selectedIds.length > 0 ? <MinusSquare size={18} className="text-indigo-400" /> : <Square size={18} />}</button></th><th className="p-5">Date</th><th className="p-5">Patient / Motif</th><th className="p-5">Mode</th><th className="p-5 text-right">Montant</th><th className="p-5 text-center pr-8">Action</th></tr></thead><tbody className="divide-y divide-slate-50">{currentPeriodData.invoices.map(inv => (<tr key={inv.id} className={`transition-colors group ${selectedIds.includes(inv.id) ? 'bg-emerald-50/50' : 'hover:bg-emerald-50/30'}`}><td className="p-5 pl-8"><button onClick={() => handleToggleSelect(inv.id)} className={`transition ${selectedIds.includes(inv.id) ? 'text-indigo-600' : 'text-slate-300'}`}>{selectedIds.includes(inv.id) ? <CheckSquare size={18} /> : <Square size={18} />}</button></td><td className="p-5 text-xs font-bold text-slate-400">{new Date(inv.date).toLocaleDateString('fr-FR')}</td><td className="p-5"><div className="font-bold text-slate-800 text-sm">{getPatientName(inv.patientId)}</div><div className="text-[10px] text-slate-400 font-medium">{inv.items?.[0]?.description || 'Recette'}</div></td><td className="p-5 text-[10px] font-black uppercase text-slate-500">{inv.paymentMethod}</td><td className="p-5 text-right font-black text-emerald-600 text-sm">{formatMAD(inv.amount)} MAD</td><td className="p-5 text-center pr-8"><button onClick={() => handleDeleteRevenue(inv.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-4 animate-fade-in">
             <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm"><p className="text-xs font-bold text-slate-500 flex items-center gap-2"><Info size={14}/> {viewType === 'day' ? `Dépenses du ${new Date(filterDay).toLocaleDateString('fr-FR')}` : `Dépenses sélectionnées`}</p><button onClick={() => openImportModal('EXPENSE')} className="bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-black transition-all"><Upload size={14}/> Importer Dépenses</button></div>
             <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><tr><th className="p-5 pl-8 w-10"><button onClick={() => handleSelectAll(currentPeriodData.expenses)} className="text-slate-400 hover:text-indigo-600 transition">{selectedIds.length === currentPeriodData.expenses.length && currentPeriodData.expenses.length > 0 ? <CheckSquare size={18} className="text-indigo-600" /> : selectedIds.length > 0 ? <MinusSquare size={18} className="text-indigo-400" /> : <Square size={18} />}</button></th><th className="p-5">Date</th><th className="p-5">Cat / Désignation</th><th className="p-5">Mode</th><th className="p-5 text-right">Montant</th><th className="p-5 text-center pr-8">Action</th></tr></thead><tbody className="divide-y divide-slate-50">{currentPeriodData.expenses.map(exp => (<tr key={exp.id} className={`transition-colors group ${selectedIds.includes(exp.id) ? 'bg-rose-50/50' : 'hover:bg-rose-50/30'}`}><td className="p-5 pl-8"><button onClick={() => handleToggleSelect(exp.id)} className={`transition ${selectedIds.includes(exp.id) ? 'text-indigo-600' : 'text-slate-300'}`}>{selectedIds.includes(exp.id) ? <CheckSquare size={18} /> : <Square size={18} />}</button></td><td className="p-5 text-xs font-bold text-slate-400">{new Date(exp.date).toLocaleDateString('fr-FR')}</td><td className="p-5"><div className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 inline-block mb-1" style={{ color: (CATEGORY_COLORS as any)[exp.category] }}>{EXPENSE_CATEGORIES[exp.category]}</div><div className="font-bold text-slate-800 text-sm">{exp.description}</div></td><td className="p-5 text-[10px] font-black uppercase text-slate-500">{exp.paymentMethod}</td><td className="p-5 text-right font-black text-rose-600 text-sm">-{formatMAD(exp.amount)} MAD</td><td className="p-5 text-center pr-8"><button onClick={() => handleDeleteExpense(exp.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div>
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in w-full max-w-lg px-4">
          <div className="bg-slate-900 text-white p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-md bg-slate-900/90 pointer-events-auto">
            <div className="flex items-center gap-4 pl-4"><div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg">{selectedIds.length}</div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Éléments</p></div>
            <div className="flex gap-2 pr-2"><button type="button" onClick={() => setSelectedIds([])} className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 rounded-xl transition cursor-pointer">Annuler</button><button type="button" onClick={handleDeleteBulk} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase shadow-lg shadow-rose-900/20 cursor-pointer relative z-[110]"><Trash2 size={14} /> Supprimer Tout</button></div>
          </div>
        </div>
      )}

      {isExpenseModalOpen && <ExpenseModal onClose={() => setIsExpenseModalOpen(false)} onSave={async (exp: Expense) => { await DataService.saveExpense(exp); loadData(); setIsExpenseModalOpen(false); }} />}
      {isRevenueModalOpen && <RevenueModal patients={patients} onClose={() => setIsRevenueModalOpen(false)} onSave={async (inv: Invoice) => { await DataService.saveInvoice(inv); loadData(); setIsRevenueModalOpen(false); }} />}
      {isImportModalOpen && <FinanceImportModal type={importType} patients={patients} onClose={() => setIsImportModalOpen(false)} onImported={() => { loadData(); setIsImportModalOpen(false); }} />}

      <style>{`
        @keyframes bounce-in { 0% { transform: translate(-50%, 100px); opacity: 0; } 60% { transform: translate(-50%, -10px); opacity: 1; } 100% { transform: translate(-50%, 0); opacity: 1; } }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

// --- MODAL D'IMPORTATION FINANCE ---
const FinanceImportModal = ({ type, onClose, onImported, patients }: { type: 'EXPENSE' | 'REVENUE', onClose: () => void, onImported: () => void, patients: Patient[] }) => {
  const [previews, setPreviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultDate, setDefaultDate] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalize = (str: string) => str ? str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "") : "";

  const parseExcelDate = (val: any): { date: string, isDetected: boolean } => {
    // Si la valeur est déjà un objet Date (cas cellDates: true)
    if (val instanceof Date && !isNaN(val.getTime())) {
      return { date: val.toISOString().split('T')[0], isDetected: true };
    }
    
    if (!val) return { date: defaultDate, isDetected: false };
    
    // Cas des dates "Nombre" d'Excel non converties
    if (typeof val === 'number') {
        try {
            const dateObj = new Date((val - 25569) * 86400 * 1000);
            if (!isNaN(dateObj.getTime())) return { date: dateObj.toISOString().split('T')[0], isDetected: true };
        } catch (e) {}
    }

    // Cas texte format JJ/MM/AAAA ou AAAA-MM-JJ
    if (typeof val === 'string') {
        const s = val.trim();
        // Match AAAA-MM-JJ
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return { date: s.slice(0, 10), isDetected: true };
        // Match JJ/MM/AAAA
        const parts = s.split(/[\/\-\.]/);
        if (parts.length === 3) {
            let d, m, y;
            if (parts[0].length === 4) { y = parts[0]; m = parts[1]; d = parts[2]; }
            else { d = parts[0]; m = parts[1]; y = parts[2]; }
            const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            if (!isNaN(new Date(iso).getTime())) return { date: iso, isDetected: true };
        }
    }
    
    return { date: defaultDate, isDetected: false };
  };

  const parseAmount = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    let str = val.toString().replace(/\s/g, '').replace(/[A-Za-z]/g, '').replace(',', '.'); 
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        // CRUCIAL: cellDates: true permet à XLSX de convertir les colonnes Date Excel en objets Date JS
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, dateNF: 'yyyy-mm-dd' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const mapped = data.map(row => {
          const keys = Object.keys(row);
          const getVal = (keywords: string[]) => {
            const foundKey = keys.find(k => {
              const nk = normalize(k);
              return keywords.some(kw => nk.includes(normalize(kw)));
            });
            return foundKey ? row[foundKey] : null;
          };

          const amount = parseAmount(getVal(['montant', 'prix', 'somme', 'amount', 'total', 'valeur', 'honoraire']));
          const dateResult = parseExcelDate(getVal(['date', 'jour', 'le', 'periode', 'moment', 'time', 'echeance']));
          const modeRaw = normalize((getVal(['paiement', 'mode', 'reglement', 'type', 'moyen']) || 'Especes').toString());
          
          let paymentMethod = PaymentType.CASH;
          if (modeRaw.includes('cheque')) paymentMethod = PaymentType.CHECK;
          else if (modeRaw.includes('virement')) paymentMethod = PaymentType.VIREMENT;
          else if (modeRaw.includes('carte') || modeRaw.includes('cb')) paymentMethod = PaymentType.CARD;

          if (type === 'EXPENSE') {
            const desc = (getVal(['designation', 'description', 'motif', 'objet', 'label', 'libelle']) || 'Dépense Importée').toString();
            const catRaw = normalize((getVal(['categorie', 'type', 'classe', 'nature']) || 'OTHER').toString());
            let category: ExpenseCategory = 'OTHER';
            if (catRaw.includes('loyer') || catRaw.includes('fixe') || catRaw.includes('charge')) category = 'FIXED';
            else if (catRaw.includes('conso') || catRaw.includes('medical') || catRaw.includes('achat')) category = 'CONSUMABLE';
            else if (catRaw.includes('salaire') || catRaw.includes('prime') || catRaw.includes('perso')) category = 'SALARY';
            else if (catRaw.includes('materiel') || catRaw.includes('equip') || catRaw.includes('immo')) category = 'EQUIPMENT';
            else if (catRaw.includes('tax') || catRaw.includes('impot') || catRaw.includes('etat')) category = 'TAX';
            return { id: `IMP-E-${Math.random()}`, date: dateResult.date, isDateDetected: dateResult.isDetected, amount, description: desc, category, paymentMethod };
          } else {
            const desc = (getVal(['motif', 'acte', 'objet', 'libelle', 'description', 'designation']) || 'Recette Importée').toString();
            const patientName = (getVal(['patient', 'client', 'nom', 'beneficiaire', 'nomcomplet']) || '').toString();
            let patientId = 'divers';
            if (patientName.trim()) {
                const p = patients.find(pat => {
                    const fullName = normalize(`${pat.lastName} ${pat.firstName}`);
                    const nameInExcel = normalize(patientName);
                    return fullName.includes(nameInExcel) || nameInExcel.includes(normalize(pat.lastName));
                });
                if (p) patientId = p.id;
            }
            return { id: `IMP-R-${Math.random()}`, date: dateResult.date, isDateDetected: dateResult.isDetected, amount, patientId, patientName: patientName || 'Divers', paymentMethod, description: desc };
          }
        });
        setPreviews(mapped.filter(m => m.amount > 0));
      } catch (err) { alert("Erreur de lecture du fichier Excel."); } finally { setIsLoading(false); }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = async () => {
    if (previews.length === 0) return;
    setIsLoading(true);
    try {
      for(const item of previews) {
        if (type === 'EXPENSE') {
          await DataService.saveExpense({
            id: `EXP-IMP-${Date.now()}-${Math.random()}`,
            date: item.date,
            amount: item.amount,
            description: item.description,
            category: item.category,
            paymentMethod: item.paymentMethod
          });
        } else {
          await DataService.saveInvoice({
            id: `INV-IMP-${Date.now()}-${Math.random()}`,
            patientId: item.patientId,
            date: item.date,
            amount: item.amount,
            status: 'PAID',
            paymentMethod: item.paymentMethod,
            items: [{ description: item.description, price: item.amount }]
          });
        }
      }
      onImported();
    } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border border-slate-200">
        <div className={`p-6 text-white flex justify-between items-center ${type === 'EXPENSE' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
          <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><FileSpreadsheet size={18}/> Importer {type === 'EXPENSE' ? 'Dépenses' : 'Recettes'}</h2>
          <button onClick={onClose} className="text-3xl font-light hover:rotate-90 transition-transform">&times;</button>
        </div>
        <div className="p-8 flex-1 overflow-y-auto space-y-6">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
            <div className="flex-1">
                <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Date de secours (si non détectée)</label>
                <input type="date" value={defaultDate} onChange={(e) => setDefaultDate(e.target.value)} className="w-full bg-white border border-amber-200 p-2 rounded-xl text-sm font-bold outline-none"/>
            </div>
            <p className="text-[10px] text-amber-700 max-w-[250px] font-medium leading-relaxed italic">
                Si une ligne n'a pas de date valide, elle sera importée à cette date précise.
            </p>
          </div>

          {previews.length === 0 ? (
            <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center bg-white hover:border-indigo-500 transition-all cursor-pointer">
              <Upload size={40} className="text-slate-300 mb-4"/>
              <p className="font-black text-slate-800 text-sm uppercase tracking-tighter">Cliquer pour charger le fichier Excel</p>
              <p className="text-[10px] text-slate-400 mt-2">Colonnes recommandées : Date, Montant, Motif, Patient</p>
              <input type="file" ref={fileInputRef} onChange={handleFile} accept=".xlsx, .xls, .csv" className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500"/> {previews.length} lignes analysées.
              </p>
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner bg-slate-50/30">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <tr><th className="p-4">Date</th><th className="p-4">Désignation / Patient</th><th className="p-4">Mode</th><th className="p-4 text-right">Montant</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previews.map((p, i) => (
                      <tr key={i} className="hover:bg-white transition-colors">
                        <td className={`p-4 font-bold ${p.isDateDetected ? 'text-slate-700' : 'text-amber-600 bg-amber-50/50'}`}>
                            {p.date} {!p.isDateDetected && <span className="text-[8px] block">(Secours)</span>}
                        </td>
                        <td className="p-4">
                          <div className="font-black text-slate-800 uppercase">{type === 'EXPENSE' ? p.description : p.patientName}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase">{type === 'EXPENSE' ? EXPENSE_CATEGORIES[p.category] : p.description}</div>
                        </td>
                        <td className="p-4 uppercase font-black text-slate-500">{p.paymentMethod}</td>
                        <td className={`p-4 text-right font-black ${type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {p.amount.toFixed(2)} MAD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
           <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] bg-white border border-slate-200 rounded-2xl transition">Annuler</button>
           <button disabled={previews.length === 0 || isLoading} onClick={confirmImport} className={`flex-[2] py-4 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition disabled:opacity-50 ${type === 'EXPENSE' ? 'bg-rose-600 shadow-rose-100' : 'bg-emerald-600 shadow-emerald-100'}`}>
             {isLoading ? 'Synchronisation...' : `Importer définitivement (${previews.length})`}
           </button>
        </div>
      </div>
    </div>
  );
};

const ExpenseModal = ({ onClose, onSave }: any) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSave({ id: `EXP-${Date.now()}`, date: formData.get('date') as string, category: formData.get('category') as ExpenseCategory, amount: Number(formData.get('amount')), description: formData.get('description') as string, paymentMethod: formData.get('paymentMethod') as PaymentType });
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-200">
                <div className="p-8 bg-rose-600 text-white flex justify-between items-center"><h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><TrendingDown size={18}/> Nouvelle Dépense</h2><button onClick={onClose} className="text-3xl font-light hover:rotate-90 transition-transform">&times;</button></div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date</label><input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-bold"/></div><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Montant</label><input name="amount" type="number" step="0.01" required className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black outline-none"/></div></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Désignation</label><input name="description" required className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-medium"/></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Catégorie</label><select name="category" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-bold">{Object.entries(EXPENSE_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mode</label><select name="paymentMethod" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-bold">{Object.values(PaymentType).map(t => <option key={t} value={t}>{t}</option>)}</select></div></div>
                    <div className="pt-4 flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition">Annuler</button><button type="submit" className="flex-[2] py-4 bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition">Enregistrer</button></div>
                </form>
            </div>
        </div>
    );
};

const RevenueModal = ({ patients, onClose, onSave }: any) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSave({ id: `INV-FIN-${Date.now()}`, patientId: formData.get('patientId') as string, date: formData.get('date') as string, amount: Number(formData.get('amount')), status: 'PAID', paymentMethod: formData.get('paymentMethod') as PaymentType, items: [{ description: 'Recette Cash', price: Number(formData.get('amount')) }] });
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-200">
                <div className="p-8 bg-emerald-600 text-white flex justify-between items-center"><h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><TrendingUp size={18}/> Nouvelle Recette</h2><button onClick={onClose} className="text-3xl font-light hover:rotate-90 transition-transform">&times;</button></div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date</label><input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-bold"/></div><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Montant</label><input name="amount" type="number" step="0.01" required className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black outline-none"/></div></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Patient</label><select name="patientId" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-bold"><option value="divers">-- Recette Divers --</option>{patients.map((p: Patient) => <option key={p.id} value={p.id}>{p.lastName.toUpperCase()} {p.firstName}</option>)}</select></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mode</label><select name="paymentMethod" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-bold">{Object.values(PaymentType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="pt-4 flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition">Annuler</button><button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition">Enregistrer</button></div>
                </form>
            </div>
        </div>
    );
};
