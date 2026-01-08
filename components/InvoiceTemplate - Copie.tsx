import React, { useState } from 'react';
import { Patient, Invoice } from '../types';
import { Activity } from 'lucide-react';

interface InvoiceTemplateProps {
  patient?: Patient;
  invoice: Invoice;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ patient, invoice }) => {
  const total = invoice.items.reduce((sum, item) => sum + item.price, 0);
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="w-[148mm] h-[210mm] mx-auto bg-white p-6 flex flex-col font-sans text-slate-900 leading-tight relative border border-slate-100 overflow-hidden box-border" style={{ pageBreakInside: 'avoid' }}>
        
        {/* Header - A5 optimized */}
        <div className="border-b-2 border-slate-800 pb-2 mb-3 grid grid-cols-3 items-center gap-2 shrink-0">
            <div className="text-left flex flex-col justify-center h-full">
                <h1 className="text-xs font-bold text-slate-900 uppercase leading-tight mb-0.5">Dr. Hasnaa El Malki</h1>
                <p className="text-[8px] font-bold text-slate-700 mb-0.5">Médecine Générale</p>
                <div className="text-[6px] text-slate-600 leading-tight space-y-0.5">
                    <p>Faculté de Médecine Casablanca</p>
                    <p>Echographie (Marrakech)</p>
                    <p>Diabétologie (Paris 13)</p>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center h-full">
                <div className="w-10 h-10 flex items-center justify-center mb-0.5">
                    {!logoError ? (
                    <img 
                        src="/logo.png" 
                        alt="Logo Cabinet" 
                        className="max-h-full max-w-full object-contain"
                        onError={() => setLogoError(true)}
                    />
                    ) : (
                    <Activity size={20} className="text-slate-200" />
                    )}
                </div>
                <p className="text-[6px] font-mono text-slate-400 uppercase tracking-tighter">INPE: 041001769</p>
            </div>
            <div className="text-right flex flex-col justify-center h-full font-sans" dir="rtl">
                <h1 className="text-xs font-bold text-slate-900 leading-none mb-0.5">الدكتورة حسناء المـالكي</h1>
                <p className="text-[9px] font-bold text-slate-700 mb-0.5">طب عــــام</p>
                <div className="text-[7px] text-slate-600 leading-tight space-y-0.5">
                    <p>خريجة كلية الطب بالدار البيضاء</p>
                </div>
            </div>
        </div>

        {/* Invoice Meta - Adjusted for A5 */}
        <div className="flex justify-between items-center mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100 shrink-0">
            <div>
                <h2 className="text-lg font-black text-slate-800 mb-0.5 tracking-tighter uppercase">Facture</h2>
                <div className="flex items-center gap-2">
                    <p className="text-slate-500 font-bold bg-white px-1 py-0.5 rounded border border-slate-100 text-[7px]">N° {invoice.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[8px] text-slate-400 font-medium">Le {new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[6px] text-slate-400 uppercase font-black mb-0.5 tracking-widest">Facturé à</p>
                {patient ? (
                    <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">{patient.lastName.toUpperCase()} {patient.firstName}</p>
                        <p className="text-[8px] text-slate-600 font-medium">CIN: {patient.cin}</p>
                    </div>
                ) : (
                    <p className="text-red-500 font-bold text-[10px]">Patient Divers</p>
                )}
            </div>
        </div>

        {/* Items Table - Strict limit for 1 page */}
        <div className="flex-1 overflow-hidden">
            <table className="w-full text-left mb-2">
                <thead>
                    <tr className="border-b border-slate-900">
                        <th className="py-1.5 text-[7px] font-black text-slate-500 uppercase tracking-widest">Désignation</th>
                        <th className="py-1.5 text-[7px] font-black text-slate-500 uppercase tracking-widest text-right">Total (MAD)</th>
                    </tr>
                </thead>
                <tbody className="text-slate-800">
                    {invoice.items.slice(0, 8).map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-50">
                            <td className="py-2 font-medium text-[11px]">{item.description}</td>
                            <td className="py-2 text-right font-bold text-xs text-slate-900">{item.price.toFixed(2)}</td>
                        </tr>
                    ))}
                    {invoice.items.length < 3 && (
                        Array.from({length: 3 - invoice.items.length}).map((_, i) => (
                            <tr key={`empty-${i}`} className="border-b border-slate-50/50">
                                <td className="py-2 text-transparent h-[30px]">-</td>
                                <td className="py-2">-</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <div className="flex justify-end mt-2">
                <div className="w-[40%] bg-slate-900 text-white p-3 rounded-xl shadow-md shrink-0">
                    <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1 opacity-70 text-[8px]">
                        <span className="font-bold">TOTAL HT</span>
                        <span className="font-bold">{total.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-tighter">NET À PAYER</span>
                        <span className="text-base font-black">{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer - Stays at the bottom of the A5 sheet */}
        <div className="mt-auto shrink-0 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                    <h4 className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-1">Mode de Règlement</h4>
                    <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 inline-block">
                        <p className="text-[7px] text-slate-700 font-bold uppercase">
                            {invoice.paymentMethod} • {invoice.status === 'PAID' ? '✔ Payé' : '⏳ En attente'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <h4 className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-1">Signature et Cachet</h4>
                    <div className="h-8 border border-dashed border-slate-200 rounded-lg"></div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-[7px] text-slate-500">
                <div className="text-left border-l-2 border-slate-100 pl-2">
                    <p className="font-bold text-slate-800">Ait Melloul - Route Biougra</p>
                    <p>Fixe: 05 28 24 11 19</p>
                </div>
                <div className="text-right border-r-2 border-slate-100 pr-2 font-sans" dir="rtl">
                    <p className="font-bold text-slate-800">أيت ملول - طريق بيوكرى</p>
                    <p>الهاتف: 05 28 24 11 19</p>
                </div>
            </div>
            
            <div className="text-center mt-2">
                <span className="bg-slate-50 text-slate-400 text-[5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                    ICE: 003677364000081 • cmhe25@gmail.com
                </span>
            </div>
        </div>
    </div>
  );
};
