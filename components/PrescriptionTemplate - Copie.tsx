import React, { useState } from 'react';
import { Patient } from '../types';
import { Activity } from 'lucide-react';

interface PrescriptionTemplateProps {
  patient?: Patient;
  prescription: string[];
  date: Date;
}

export const PrescriptionTemplate: React.FC<PrescriptionTemplateProps> = ({ patient, prescription, date }) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="h-[210mm] w-[148mm] mx-auto bg-white p-6 flex flex-col font-serif text-slate-900 leading-tight overflow-hidden relative border border-slate-100 box-border" style={{ pageBreakInside: 'avoid' }}>
        
        {/* Header - A5 Optimized */}
        <div className="border-b-2 border-slate-800 pb-2 mb-3 grid grid-cols-3 items-center gap-2 shrink-0">
            
            {/* Colonne Gauche: Français */}
            <div className="text-left flex flex-col justify-center h-full">
                <h1 className="text-xs font-bold text-slate-900 uppercase leading-tight mb-0.5">Dr. Hasnaa El Malki</h1>
                <p className="text-[8px] font-bold text-slate-700 mb-0.5">Médecine Générale</p>
                <div className="text-[7px] text-slate-600 leading-tight space-y-0.5">
                    <p>Faculté de Médecine Casablanca</p>
                    <p>Echographie Générale (Marrakech)</p>
                    <p>Diabétologie (Paris 13)</p>
                </div>
            </div>

            {/* Colonne Centre: Logo */}
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
                <p className="text-[6px] font-mono text-slate-400 uppercase tracking-widest">INPE: 041001769</p>
            </div>

            {/* Colonne Droite: Arabe */}
            <div className="text-right flex flex-col justify-center h-full font-sans" dir="rtl">
                <h1 className="text-xs font-bold text-slate-900 leading-none mb-0.5">الدكتورة حسناء المـالكي</h1>
                <p className="text-[9px] font-bold text-slate-700 mb-0.5">طب عــــام</p>
                <div className="text-[7px] text-slate-600 leading-tight space-y-0.5">
                    <p>خريجة كلية الطب بالدار البيضاء</p>
                    <p>الفحص بالصدى (مراكش)</p>
                </div>
            </div>
        </div>

        {/* Patient Info - Adjusted for A5 */}
        <div className="mb-3 px-1 shrink-0">
            <div className="flex justify-between items-end border-b border-dotted border-slate-300 pb-1.5">
                <div className="flex items-baseline gap-2">
                    <span className="text-[7px] text-slate-400 uppercase font-bold tracking-widest">Patient:</span>
                    <span className="text-sm font-bold">
                        {patient ? `${patient.lastName.toUpperCase()} ${patient.firstName}` : '.......................................'}
                    </span>
                    {patient && <span className="text-[9px] text-slate-400 ml-1">({new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} ans)</span>}
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[7px] text-slate-400 uppercase font-bold">Le:</span>
                    <span className="text-xs font-medium">{new Date(date).toLocaleDateString('fr-FR')}</span>
                </div>
            </div>
        </div>

        {/* Prescription Content - Strict height management for 1 page */}
        <div className="flex-1 px-3 py-1 overflow-hidden">
            <h2 className="text-center font-bold text-base uppercase underline decoration-1 underline-offset-[4px] mb-4 tracking-[0.2em] text-slate-800">Ordonnance</h2>
            <div className="max-h-[110mm] overflow-hidden">
                <ul className="space-y-2.5">
                    {prescription.map((med, idx) => (
                    <li key={idx} className="text-xs text-slate-800 flex items-start">
                        <span className="font-bold mr-3 text-slate-300 min-w-[12px]">{idx + 1}.</span> 
                        <span className="flex-1 border-b border-slate-50 pb-0.5">{med}</span>
                    </li>
                    ))}
                    {prescription.length === 0 && (
                        <div className="space-y-6 opacity-5 mt-2">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <li key={i} className="border-b border-slate-400 pb-1"></li>
                            ))}
                        </div>
                    )}
                    {prescription.length > 12 && (
                        <p className="text-[8px] text-red-400 italic font-bold mt-2">... suite sur une autre page (recommandé de diviser)</p>
                    )}
                </ul>
            </div>
        </div>

        {/* Bottom Section - Adjusted to stay at the bottom of the A5 sheet */}
        <div className="mt-auto shrink-0 pt-2 border-t border-slate-200">
            <div className="flex justify-center mb-3">
                <div className="text-center border border-slate-100 px-6 py-1.5 rounded-xl">
                    <p className="font-bold text-slate-300 uppercase tracking-[0.2em] text-[6px]">Signature et Cachet</p>
                    <div className="h-6"></div>
                </div>
            </div>
            
            {/* Footer Address */}
            <div className="grid grid-cols-2 gap-4 text-[7px] text-slate-500">
                <div className="text-left space-y-0.5 border-l-2 border-slate-100 pl-2">
                    <p className="font-bold text-slate-800 uppercase">Cabinet Dr. Hasnaa El Malki</p>
                    <p>Ait Melloul - Route Biougra</p>
                    <p className="font-medium text-slate-600">GSM: 06 41 23 83 44</p>
                </div>
                <div className="text-right space-y-0.5 border-r-2 border-slate-100 pr-2 font-sans" dir="rtl">
                    <p className="font-bold text-slate-800">عيادة الدكتورة حسناء المـالكي</p>
                    <p>أيت ملول - طريق بيوكرى</p>
                    <p className="font-medium text-slate-600">النقال: 06 41 23 83 44</p>
                </div>
            </div>

            <div className="mt-1.5 pt-1 border-t border-slate-50 text-center text-[6px] text-slate-400 uppercase tracking-[0.1em]">
                ICE: 003677364000081 • cmhe25@gmail.com
            </div>
        </div>
    </div>
  );
};
