import React, { useState, useEffect, useMemo } from 'react';
import { 
  Banknote, TrendingDown, TrendingUp, Plus, Calendar, 
  FileText, Trash2, PieChart as PieIcon, BarChart3, Filter, Coins, Receipt, Users, PlusCircle, LayoutGrid, CalendarDays, ChevronRight, ChevronLeft
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
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
  const [isAnnualView, setIsAnnualView] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setExpenses(DataService.getExpenses());
    setInvoices(DataService.getInvoices());
    setPatients(DataService.getPatients());
  };

  const getPatientName = (id: string) => {
    const p = patients.find(pat => pat.id === id);
    return p ? `${p.lastName} ${p.firstName}` : 'Recette Divers';
  };

  const formatMAD = (val: number) => val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Filtrage des données selon la période sélectionnée
  const currentPeriodData = useMemo(() => {
    const filteredExp = expenses.filter(e => {
      const d = new Date(e.date);
      const yearMatch = d.getFullYear() === filterYear;
      const monthMatch = isAnnualView ? true : d.getMonth() === filterMonth;
      return yearMatch && monthMatch;
    });

    const filteredInv = invoices.filter(i => {
      const d = new Date(i.date);
      const yearMatch = d.getFullYear() === filterYear;
      const monthMatch = isAnnualView ? true : d.getMonth() === filterMonth;
      return yearMatch && monthMatch && i.status === 'PAID';
    });

    return { expenses: filteredExp, invoices: filteredInv };
  }, [expenses, invoices, filterMonth, filterYear, isAnnualView]);

  const totalIncome = currentPeriodData.invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = currentPeriodData.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netResult = totalIncome - totalExpense;

  // Données pour le graphique de l'année (12 mois)
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
        Décaissements: Number(exp.toFixed(2)),
        Résultat: Number((inc - exp).toFixed(2))
      };
    });
  }, [invoices, expenses, filterYear]);

  // Données pour le graphique des catégories de dépenses
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

  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Supprimer cette dépense ?")) {
      DataService.deleteExpense(id);
      loadData();
    }
  };

  const handleDeleteRevenue = (id: string) => {
    if (window.confirm("Supprimer cet encaissement ? Cette action est irréversible.")) {
      DataService.deleteInvoice(id);
      loadData();
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-slate-50">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Trésorerie & Finance</h1>
          <p className="text-slate-500 font-medium">Suivi global des flux monétaires du cabinet</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsRevenueModalOpen(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition active:scale-95 font-bold">
            <TrendingUp size={20}/> Recette
          </button>
          <button onClick={() => setIsExpenseModalOpen(true)} className="bg-rose-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-100 hover:bg-rose-700 transition active:scale-95 font-bold">
            <TrendingDown size={20}/> Dépense
          </button>
        </div>
      </div>

      {/* FILTERS & TABS BAR */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-center justify-between bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-auto">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Vue d'ensemble
          </button>
          <button 
            onClick={() => setActiveTab('revenues')} 
            className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${activeTab === 'revenues' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Journal Recettes
          </button>
          <button 
            onClick={() => setActiveTab('expenses')} 
            className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${activeTab === 'expenses' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Journal Dépenses
          </button>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto px-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setIsAnnualView(false)} 
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${!isAnnualView ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              Mois
            </button>
            <button 
              onClick={() => setIsAnnualView(true)} 
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${isAnnualView ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              Année
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden lg:block"></div>

          <div className="flex items-center gap-2">
            {!isAnnualView && (
              <select 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                className="bg-transparent text-sm font-black text-slate-700 outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>{new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}</option>
                ))}
              </select>
            )}
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-black text-slate-700 outline-none cursor-pointer border-l pl-2 border-slate-200"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in pb-10">
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Encaissements Total</p>
                  <p className="text-3xl font-black text-emerald-600 tabular-nums">{formatMAD(totalIncome)} <span className="text-sm">MAD</span></p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform"><TrendingUp size={28}/></div>
              </div>
              
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Décaissements Total</p>
                  <p className="text-3xl font-black text-rose-600 tabular-nums">{formatMAD(totalExpense)} <span className="text-sm">MAD</span></p>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform"><TrendingDown size={28}/></div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-md flex items-center justify-between group bg-gradient-to-br from-white to-slate-50">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Résultat Net (Bénéfice)</p>
                  <p className={`text-3xl font-black tabular-nums ${netResult >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>{formatMAD(netResult)} <span className="text-sm">MAD</span></p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform"><Coins size={28}/></div>
              </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-lg">
                    <BarChart3 size={20} className="text-indigo-600"/> 
                    {isAnnualView ? `Performance de l'année ${filterYear}` : `Flux financiers de ${new Date(0, filterMonth).toLocaleString('fr-FR', { month: 'long' })}`}
                  </h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={annualChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }}/>
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }}/>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: number) => [formatMAD(val) + " MAD"]}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}/>
                      <Bar dataKey="Encaissements" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                      <Bar dataKey="Décaissements" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-lg mb-8">
                  <PieIcon size={20} className="text-orange-500"/>
                  Par Catégorie
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={expenseByCategory} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={8} 
                        dataKey="value"
                      >
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={(CATEGORY_COLORS as any)[entry.key] || '#cbd5e1'} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: number) => formatMAD(val) + " MAD"} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {expenseByCategory.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2 font-bold text-slate-500">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (CATEGORY_COLORS as any)[cat.key] }}></div>
                        {cat.name}
                      </div>
                      <span className="font-black text-slate-800">{formatMAD(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenues' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-5 pl-8">Date</th>
                  <th className="p-5">Patient / Motif</th>
                  <th className="p-5">Mode</th>
                  <th className="p-5 text-right">Montant</th>
                  <th className="p-5 text-center pr-8">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentPeriodData.invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="p-5 pl-8 text-xs font-bold text-slate-400">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                    <td className="p-5">
                      <div className="font-bold text-slate-800 text-sm">{getPatientName(inv.patientId)}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{inv.items?.[0]?.description || 'Encaissement'}</div>
                    </td>
                    <td className="p-5">
                      <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-lg uppercase text-slate-500">{inv.paymentMethod}</span>
                    </td>
                    <td className="p-5 text-right font-black text-emerald-600 text-sm">{formatMAD(inv.amount)} MAD</td>
                    <td className="p-5 text-center pr-8">
                      <button 
                        onClick={() => handleDeleteRevenue(inv.id)} 
                        className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {currentPeriodData.invoices.length === 0 && (
                  <tr><td colSpan={5} className="p-20 text-center text-slate-300 italic">Aucune recette trouvée pour cette période.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-5 pl-8">Date</th>
                  <th className="p-5">Catégorie / Désignation</th>
                  <th className="p-5">Mode</th>
                  <th className="p-5 text-right">Montant</th>
                  <th className="p-5 text-center pr-8">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentPeriodData.expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-rose-50/30 transition-colors group">
                    <td className="p-5 pl-8 text-xs font-bold text-slate-400">{new Date(exp.date).toLocaleDateString('fr-FR')}</td>
                    <td className="p-5">
                      <div className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-slate-100 inline-block mb-1" style={{ color: (CATEGORY_COLORS as any)[exp.category] }}>
                        {EXPENSE_CATEGORIES[exp.category]}
                      </div>
                      <div className="font-bold text-slate-800 text-sm">{exp.description}</div>
                    </td>
                    <td className="p-5">
                      <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-lg uppercase text-slate-500">{exp.paymentMethod}</span>
                    </td>
                    <td className="p-5 text-right font-black text-rose-600 text-sm">-{formatMAD(exp.amount)} MAD</td>
                    <td className="p-5 text-center pr-8">
                      <button 
                        onClick={() => handleDeleteExpense(exp.id)} 
                        className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {currentPeriodData.expenses.length === 0 && (
                  <tr><td colSpan={5} className="p-20 text-center text-slate-300 italic">Aucune dépense trouvée pour cette période.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      {isExpenseModalOpen && (
        <ExpenseModal 
          onClose={() => setIsExpenseModalOpen(false)} 
          onSave={(exp: Expense) => { DataService.saveExpense(exp); loadData(); setIsExpenseModalOpen(false); }}
        />
      )}
      {isRevenueModalOpen && (
        <RevenueModal 
          patients={patients} 
          onClose={() => setIsRevenueModalOpen(false)} 
          onSave={(inv: Invoice) => { DataService.saveInvoice(inv); loadData(); setIsRevenueModalOpen(false); }}
        />
      )}
    </div>
  );
};

// MODAL COMPONENTS (Internal)
const ExpenseModal = ({ onClose, onSave }: any) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSave({
            id: `EXP-${Date.now()}`,
            date: formData.get('date') as string,
            category: formData.get('category') as ExpenseCategory,
            amount: Number(formData.get('amount')),
            description: formData.get('description') as string,
            paymentMethod: formData.get('paymentMethod') as PaymentType
        });
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-200">
                <div className="p-8 bg-rose-600 text-white flex justify-between items-center">
                  <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><TrendingDown size={18}/> Nouvelle Dépense</h2>
                  <button onClick={onClose} className="text-3xl font-light hover:rotate-90 transition-transform">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label>
                          <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 font-bold"/>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant (MAD)</label>
                          <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-rose-500"/>
                        </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Désignation</label>
                      <input name="description" required placeholder="Ex: Loyer, Electricité..." className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 font-medium"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Catégorie</label>
                          <select name="category" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 font-bold">
                            {Object.entries(EXPENSE_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mode de Paiement</label>
                          <select name="paymentMethod" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 font-bold">
                            {Object.values(PaymentType).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition">Annuler</button>
                      <button type="submit" className="flex-[2] py-4 bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition">Enregistrer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RevenueModal = ({ patients, onClose, onSave }: any) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const amount = Number(formData.get('amount'));
        onSave({
            id: `INV-FIN-${Date.now()}`,
            patientId: formData.get('patientId') as string,
            date: formData.get('date') as string,
            amount: amount,
            status: 'PAID',
            paymentMethod: formData.get('paymentMethod') as PaymentType,
            items: [{ description: formData.get('description') as string || 'Recette', price: amount }]
        });
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-200">
                <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
                  <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><TrendingUp size={18}/> Nouvelle Recette</h2>
                  <button onClick={onClose} className="text-3xl font-light hover:rotate-90 transition-transform">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label>
                          <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold"/>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant (MAD)</label>
                          <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500"/>
                        </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient</label>
                      <select name="patientId" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                        <option value="">-- Recette Divers (Anonyme) --</option>
                        {patients.map((p: Patient) => <option key={p.id} value={p.id}>{p.lastName.toUpperCase()} {p.firstName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Motif / Désignation</label>
                      <input name="description" required placeholder="Ex: Consultation, Acte ECG..." className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Règlement</label>
                      <select name="paymentMethod" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                        {Object.values(PaymentType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition">Annuler</button>
                      <button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition">Valider l'Encaissement</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
