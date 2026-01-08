import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Plus, Search, Printer, Download, CreditCard, 
  CheckCircle, AlertCircle, TrendingUp, DollarSign, RefreshCw, Trash2, Filter, Receipt
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import { Invoice, Patient, PaymentType, Permission } from '../types';
import { InvoiceTemplate } from './InvoiceTemplate';

const MEDICAL_ACTS = [
  { label: 'Consultation Standard', price: 200.00 },
  { label: 'Consultation + ECG', price: 350.00 },
  { label: 'Échographie Abdominale', price: 400.00 },
  { label: 'Échographie Pelvienne', price: 400.00 },
  { label: 'Suivi de Grossesse', price: 250.00 },
  { label: 'Certificat Médical', price: 100.00 },
];

export const BillingManager: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const currentUser = AuthService.getCurrentUser();
  const canSeeStats = currentUser?.permissions.includes(Permission.STATS);
  const canViewHistory = currentUser?.permissions.includes(Permission.BILLING_VIEW);

  useEffect(() => {
    loadData();
  }, [canViewHistory]);

  const loadData = () => {
    // Si l'utilisateur n'a pas le droit de voir l'historique, on ne charge rien
    if (canViewHistory) {
      const allInvoices = DataService.getInvoices();
      setInvoices(allInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } else {
      setInvoices([]);
    }
    setPatients(DataService.getPatients());
  };

  const getPatient = (id: string) => patients.find(p => p.id === id);

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalUnpaid = invoices.filter(i => i.status === 'PENDING').reduce((sum, inv) => sum + inv.amount, 0);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const p = getPatient(inv.patientId);
      const term = searchTerm.toLowerCase();
      if (!term) return true;
      if (p) {
          return p.lastName.toLowerCase().includes(term) || p.firstName.toLowerCase().includes(term);
      }
      return "divers".includes(term);
    });
  }, [invoices, patients, searchTerm]);

  const handlePrint = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setTimeout(() => window.print(), 100);
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setTimeout(() => {
        const element = document.getElementById('invoice-render-target');
        const p = getPatient(invoice.patientId);
        const opt = {
          margin: 0,
          filename: `Facture_${invoice.id}_${p?.lastName || 'Divers'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        (window as any).html2pdf().set(opt).from(element).save();
    }, 100);
  };

  const handleStatusToggle = (invoice: Invoice) => {
    const newStatus: 'PAID' | 'PENDING' = invoice.status === 'PAID' ? 'PENDING' : 'PAID';
    DataService.saveInvoice({ ...invoice, status: newStatus });
    loadData();
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Confirmer la suppression ?')) {
      DataService.deleteInvoice(id);
      loadData();
    }
  };

  const formatMAD = (val: number) => val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Facturation & Honoraires (MAD)</h1>
            <p className="text-slate-500 font-medium mt-1">
                {canViewHistory ? "Émission et suivi des règlements" : "Saisie de nouvelles factures"}
            </p>
        </div>
        
        <button 
        onClick={() => { setSelectedInvoice(null); setIsModalOpen(true); }}
        className="bg-medical-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-medical-100 hover:bg-medical-700 transition active:scale-95 font-bold text-sm"
        >
        <Plus size={20} /> Nouvelle Facture
        </button>
      </div>

      {canSeeStats && canViewHistory && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <KpiCard label="Encaissements" value={`${formatMAD(totalRevenue)} MAD`} icon={TrendingUp} color="emerald" />
            <KpiCard label="Impayés Clients" value={`${formatMAD(totalUnpaid)} MAD`} icon={AlertCircle} color="rose" />
            <KpiCard label="Factures (Mois)" value={invoices.filter(i => new Date(i.date).getMonth() === new Date().getMonth()).length.toString()} icon={FileText} color="blue" />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
          {canViewHistory ? (
              <>
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                        type="text" 
                        placeholder="Chercher par nom de patient..." 
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-medical-500 bg-white text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <InvoiceTable 
                        data={filteredInvoices} 
                        getPatient={getPatient} 
                        onPrint={handlePrint} 
                        onDownload={handleDownloadPDF} 
                        onToggleStatus={handleStatusToggle} 
                        onDelete={handleDeleteInvoice} 
                    />
                </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-fade-in">
                  <div className="w-24 h-24 bg-medical-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                      <Receipt size={48} className="text-medical-600" />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Espace de Saisie Rapide</h2>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 font-medium mb-8">
                      Vous avez les droits pour émettre de nouvelles factures. L'historique des transactions passées est réservé à l'administration.
                  </p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-medical-600 text-white px-10 py-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-medical-100 hover:bg-medical-700 transition active:scale-95 font-black uppercase tracking-widest text-xs"
                  >
                    <Plus size={24} /> Émettre une nouvelle facture
                  </button>
              </div>
          )}
      </div>

      {isModalOpen && (
        <InvoiceModal 
            patients={patients} 
            onClose={() => setIsModalOpen(false)} 
            onSave={(inv: Invoice) => {
                DataService.saveInvoice(inv);
                loadData();
                setIsModalOpen(false);
                // Si l'utilisateur n'a pas accès à l'historique, on lui propose d'imprimer directement la facture qu'il vient de créer
                if (!canViewHistory) {
                    handlePrint(inv);
                }
            }} 
        />
      )}

      <div className="print-only">
        {selectedInvoice && <InvoiceTemplate invoice={selectedInvoice} patient={getPatient(selectedInvoice.patientId)} />}
      </div>
      <div className="pdf-container">
        {selectedInvoice && (
            <div id="invoice-render-target">
                <InvoiceTemplate invoice={selectedInvoice} patient={getPatient(selectedInvoice.patientId)} />
            </div>
        )}
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, icon: Icon, color }: any) => (
    <div className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group transition-all hover:shadow-md hover:border-${color}-200`}>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-xl font-black text-slate-800 tabular-nums`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition`}>
            <Icon size={24} />
        </div>
    </div>
);

const InvoiceTable = ({ data, getPatient, onPrint, onDownload, onToggleStatus, onDelete }: any) => (
    <table className="w-full text-left">
        <thead className="bg-slate-50/50 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
            <tr>
                <th className="p-4 pl-6">N° Facture</th>
                <th className="p-4">Patient / Mutuelle</th>
                <th className="p-4">Détail Actes</th>
                <th className="p-4 text-right">Montant</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4 text-right pr-6">Actions</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
            {data.map((inv: Invoice) => {
                const p = getPatient(inv.patientId);
                return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition group">
                        <td className="p-4 pl-6 font-mono text-slate-400 text-xs">#{inv.id.slice(-6).toUpperCase()}</td>
                        <td className="p-4">
                            <div className="font-bold text-slate-800 text-sm">{p ? `${p.lastName} ${p.firstName}` : "Recette Divers / Inconnu"}</div>
                            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
                                {new Date(inv.date).toLocaleDateString('fr-FR')} 
                                {p?.insuranceType && p.insuranceType !== 'AUCUNE' && (
                                    <>• <span className="text-medical-600">{p.insuranceType}</span></>
                                )}
                            </div>
                        </td>
                        <td className="p-4 text-xs text-slate-500 max-w-xs truncate">
                            {inv.items?.map(i => i.description).join(', ') || 'N/A'}
                        </td>
                        <td className="p-4 text-right font-black text-slate-900 text-sm">{inv.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD</td>
                        <td className="p-4 text-center">
                            <button 
                                onClick={() => onToggleStatus(inv)}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase transition shadow-sm ${
                                    inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}
                            >
                                {inv.status === 'PAID' ? 'Payée' : 'Attente'}
                                <RefreshCw size={10} className="opacity-50" />
                            </button>
                        </td>
                        <td className="p-4 text-right pr-6">
                            <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition">
                                <button onClick={() => onDownload(inv)} title="PDF" className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"><Download size={18} /></button>
                                <button onClick={() => onPrint(inv)} title="Imprimer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"><Printer size={18} /></button>
                                <button onClick={() => onDelete(inv.id)} title="Supprimer" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"><Trash2 size={18} /></button>
                            </div>
                        </td>
                    </tr>
                );
            })}
            {data.length === 0 && (
                <tr>
                    <td colSpan={6} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest italic">Aucun enregistrement trouvé</td>
                </tr>
            )}
        </tbody>
    </table>
);

const InvoiceModal = ({ patients, onClose, onSave }: any) => {
    const [patientId, setPatientId] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<{description: string, price: number}[]>([{description: 'Consultation', price: 200.00}]);
    const [paymentMethod, setPaymentMethod] = useState(PaymentType.CASH);
    const [status, setStatus] = useState<'PAID' | 'PENDING'>('PAID');

    const addItem = (description: string, price: number) => {
        setItems([...items, { description, price: Number(price) }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: 'description' | 'price', value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: field === 'price' ? Number(value) : value };
        setItems(newItems);
    };

    const total = items.reduce((sum, item) => sum + Number(item.price), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId) return;

        const newInvoice: Invoice = {
            id: `INV-${Date.now()}`,
            patientId,
            date: issueDate,
            amount: total,
            status,
            paymentMethod,
            items
        };
        onSave(newInvoice);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800">Émettre une Facture (MAD)</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-light hover:rotate-90 transition-transform">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient bénéficiaire</label>
                            <select required className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-medical-500 font-bold bg-white" value={patientId} onChange={e => setPatientId(e.target.value)}>
                                <option value="">-- Sélectionner --</option>
                                {patients.map((p: Patient) => (
                                    <option key={p.id} value={p.id}>{p.lastName.toUpperCase()} {p.firstName} ({p.cin})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date d'émission</label>
                            <input 
                                type="date" 
                                value={issueDate} 
                                onChange={(e) => setIssueDate(e.target.value)}
                                required
                                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-medical-500 bg-white font-bold" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Actes médicaux & Honoraires</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {MEDICAL_ACTS.map((act, idx) => (
                                <button key={idx} type="button" onClick={() => addItem(act.label, act.price)} className="px-3 py-1.5 text-[10px] font-bold bg-medical-50 text-medical-700 rounded-lg border border-medical-100 hover:bg-medical-100 transition">+ {act.label}</button>
                            ))}
                        </div>
                        <div className="space-y-2 mb-4">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex gap-2 animate-fade-in">
                                    <input type="text" className="flex-1 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-medical-500 font-medium" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Description"/>
                                    <input type="number" step="0.01" className="w-28 p-2.5 border border-slate-200 rounded-xl text-sm text-right font-black outline-none focus:ring-2 focus:ring-medical-500" value={item.price} onChange={(e) => updateItem(idx, 'price', e.target.value)}/>
                                    <button type="button" onClick={() => removeItem(idx)} className="text-slate-300 hover:text-rose-500 px-2 text-xl font-light">&times;</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center p-5 bg-slate-900 rounded-2xl text-white shadow-lg">
                            <span className="font-black text-xs uppercase tracking-[0.2em] opacity-60">Total Honoraires</span>
                            <span className="text-2xl font-black">{total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs">MAD</span></span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mode de règlement</label>
                            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentType)} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none font-bold bg-white">
                                {Object.values(PaymentType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">État de la facture</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button type="button" onClick={() => setStatus('PAID')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition ${status === 'PAID' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>PAYÉE</button>
                                <button type="button" onClick={() => setStatus('PENDING')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition ${status === 'PENDING' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}>ATTENTE</button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition">Annuler</button>
                        <button type="submit" className="flex-[2] py-4 bg-medical-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-medical-100 hover:bg-medical-700 transition active:scale-95">Valider la Facture</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
