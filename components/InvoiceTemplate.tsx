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

  // URL pour le code QR
  const qrData = encodeURIComponent(`Facture N°${invoice.id.slice(-6).toUpperCase()} - Dr. Hasnaa El Malki`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}&color=0c4a6e`;

  return (
    <div className="w-[148mm] h-[210mm] mx-auto bg-white p-6 flex flex-col font-sans text-slate-900 leading-tight relative border border-slate-100 overflow-hidden box-border" style={{ pageBreakInside: 'avoid' }}>
        
        {/* Header - Professionnel avec Suivi de Grossesse */}
        <div className="border-b-2 border-slate-800 pb-2 mb-3 grid grid-cols-3 items-center gap-2 shrink-0">
            {/* Colonne Gauche: Français */}
            <div className="text-left flex flex-col justify-center h-full">
                <h1 className="text-[13px] font-bold text-slate-900 uppercase leading-tight mb-0.5">Dr. Hasnaa El Malki</h1>
                <p className="text-[9px] font-bold text-slate-700 mb-1 italic">Médecine Générale</p>
                <div className="text-[7.5px] text-slate-600 leading-tight space-y-0.5 font-sans">
                    <p>Faculté de Médecine Casablanca</p>
                    <p>Echographie • Diabétologie</p>
                    <p className="font-bold text-slate-800 uppercase tracking-tighter">Suivi de Grossesse</p>
                </div>
            </div>
            {/* Colonne Centre: Logo */}
            <div className="flex flex-col items-center justify-center h-full">
                <div className="w-10 h-10 flex items-center justify-center mb-1">
                    {!logoError ? (
                    <img 
                        src="/logo.png" 
                        alt="Logo Cabinet" 
                        className="max-h-full max-w-full object-contain"
                        onError={() => setLogoError(true)}
                    />
                    ) : (
                    <Activity size={24} className="text-slate-200" />
                    )}
                </div>
                <p className="text-[7px] font-mono text-slate-500 font-bold uppercase tracking-tighter">INPE: 041001769</p>
            </div>
            {/* Colonne Droite: Arabe */}
            <div className="text-right flex flex-col justify-center h-full font-sans" dir="rtl">
                <h1 className="text-[14px] font-bold text-slate-900 leading-none mb-1">الدكتورة حسناء المـالكي</h1>
                <p className="text-[10px] font-bold text-slate-700 mb-1">طب عــــام</p>
                <div className="text-[8.5px] text-slate-600 leading-tight font-medium">
                    <p>خريجة كلية الطب بالدار البيضاء</p>
                    <p className="font-bold text-slate-800">تتبع الحمل</p>
                </div>
            </div>
        </div>

        {/* Invoice Meta */}
        <div className="flex justify-between items-center mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shrink-0">
            <div>
                <h2 className="text-xl font-black text-slate-900 mb-0.5 tracking-tighter uppercase">Facture</h2>
                <div className="flex items-center gap-3">
                    <p className="text-slate-500 font-black bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[8px]">N° {invoice.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[9px] text-slate-400 font-bold">Le {new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[7px] text-slate-400 uppercase font-black mb-1 tracking-widest">Facturé à</p>
                {patient ? (
                    <div className="space-y-0.5">
                        <p className="text-sm font-black text-slate-800 uppercase">{patient.lastName} {patient.firstName}</p>
                        <p className="text-[9px] text-slate-500 font-bold">CIN: {patient.cin} • {patient.insuranceType}</p>
                    </div>
                ) : (
                    <p className="text-slate-400 font-bold text-[10px]">Patient Divers</p>
                )}
            </div>
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-hidden px-1">
            <table className="w-full text-left mb-4">
                <thead>
                    <tr className="border-b-2 border-slate-900">
                        <th className="py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Désignation de l'acte</th>
                        <th className="py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total (MAD)</th>
                    </tr>
                </thead>
                <tbody className="text-slate-800">
                    {invoice.items.slice(0, 8).map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                            <td className="py-3 font-bold text-xs text-slate-700">{item.description}</td>
                            <td className="py-3 text-right font-black text-sm text-slate-900">{item.price.toFixed(2)}</td>
                        </tr>
                    ))}
                    {invoice.items.length < 3 && (
                        Array.from({length: 3 - invoice.items.length}).map((_, i) => (
                            <tr key={`empty-${i}`} className="border-b border-slate-50">
                                <td className="py-3 text-transparent h-[40px]">-</td>
                                <td className="py-3">-</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <div className="flex justify-end mt-4">
                <div className="w-[45%] bg-slate-900 text-white p-4 rounded-2xl shadow-xl shrink-0">
                    <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2 opacity-70 text-[10px] font-bold">
                        <span>TOTAL HT</span>
                        <span>{total.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black uppercase tracking-tighter">Net à payer</span>
                        <span className="text-xl font-black">{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer with Bilingual Address and Centered French Contact */}
        <div className="mt-auto shrink-0 pt-3 border-t-2 border-slate-100">
            <div className="grid grid-cols-2 gap-6 mb-3 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white p-1 border border-slate-200 rounded-lg shadow-sm shrink-0">
                        <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h4 className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mode de Règlement</h4>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 inline-block">
                            <p className="text-[8px] text-slate-700 font-black uppercase">
                                {invoice.paymentMethod} • {invoice.status === 'PAID' ? '✔ Payée' : '⏳ Attente'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <h4 className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Signature et Cachet</h4>
                    <div className="h-10 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/20"></div>
                </div>
            </div>
            
            {/* Addresses (FR/AR) */}
            <div className="grid grid-cols-2 gap-6 text-[9.5px] text-slate-600 font-sans mb-1.5 px-2">
                <div className="text-left border-l-2 border-medical-500 pl-3">
                    <p className="font-bold text-slate-800">Imm. Damou, 1er étage, Route de Biougra, Ait Melloul</p>
                </div>
                <div className="text-right border-r-2 border-medical-500 pr-3">
                    <p className="font-bold text-slate-800 text-right" dir="rtl">عمارة دامو الطابق الأول طريق بيوكرى أيت ملول</p>
                </div>
            </div>

            {/* Centered Phone (French only) */}
            <div className="text-center mb-2">
                <p className="text-[9.5px] font-medium text-slate-700 font-sans">
                    Fixe: 05 28 24 11 19 | GSM: 06 41 23 83 44
                </p>
            </div>
            
            <div className="text-center mt-3">
                <span className="bg-slate-50 text-slate-400 text-[6px] px-4 py-1 rounded-full font-black uppercase tracking-[0.2em] border border-slate-100">
                    ICE: 003677364000081 • Contact: cmhe25@gmail.com
                </span>
            </div>
        </div>
    </div>
  );
};
