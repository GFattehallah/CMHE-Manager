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
  
  // URL pour le code QR (encodage des coordonnées du cabinet)
  const qrData = encodeURIComponent("Dr. Hasnaa El Malki - Imm. Damou, 1er étage, Ait Melloul. Tél: 0528241119");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}&color=0c4a6e`;

  return (
    <div className="h-[210mm] w-[148mm] mx-auto bg-white p-6 flex flex-col font-serif text-slate-900 leading-tight overflow-hidden relative border border-slate-100 box-border" style={{ pageBreakInside: 'avoid' }}>
        
        {/* Header - Professionnel avec Suivi de Grossesse */}
        <div className="border-b-2 border-slate-800 pb-2 mb-3 grid grid-cols-3 items-center gap-2 shrink-0">
            
            {/* Colonne Gauche: Français */}
            <div className="text-left flex flex-col justify-center h-full">
                <h1 className="text-[13px] font-bold text-slate-900 uppercase leading-tight mb-0.5">Dr. Hasnaa El Malki</h1>
                <p className="text-[9px] font-bold text-slate-700 mb-1 italic">Médecine Générale</p>
                <div className="text-[7.5px] text-slate-600 leading-normal space-y-0.5 font-sans">
                    <p>Lauréate de la Faculté de Médecine de Casablanca</p>
                    <p>Diplômée en Échographie (Marrakech)</p>
                    <p>Diplômée en Diabétologie (Université Paris 13)</p>
                    <p className="font-bold text-slate-800 uppercase tracking-tighter">Suivi de Grossesse</p>
                </div>
            </div>

            {/* Colonne Centre: Logo & INPE */}
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
                <p className="text-[7px] font-mono text-slate-500 font-bold uppercase tracking-widest bg-slate-50 px-1 rounded">INPE: 041001769</p>
            </div>

            {/* Colonne Droite: Arabe */}
            <div className="text-right flex flex-col justify-center h-full font-sans" dir="rtl">
                <h1 className="text-[14px] font-bold text-slate-900 leading-none mb-1">الدكتورة حسناء المـالكي</h1>
                <p className="text-[10px] font-bold text-slate-700 mb-1">طب عــــام</p>
                <div className="text-[8.5px] text-slate-600 leading-normal space-y-0.5 font-medium">
                    <p>خريجة كلية الطب بالدار البيضاء</p>
                    <p>دبلوم الفحص بالصدى (مراكش)</p>
                    <p>دبلوم أمراض السكري (جامعة باريس 13)</p>
                    <p className="font-bold text-slate-800">تتبع الحمل</p>
                </div>
            </div>
        </div>

        {/* Patient Info */}
        <div className="mb-4 px-1 shrink-0">
            <div className="flex justify-between items-end border-b border-dotted border-slate-300 pb-2">
                <div className="flex items-baseline gap-2">
                    <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Patient:</span>
                    <span className="text-base font-bold text-slate-900">
                        {patient ? `${patient.lastName.toUpperCase()} ${patient.firstName}` : '......................................................'}
                    </span>
                    {patient && <span className="text-[10px] text-slate-500 ml-2 font-sans font-medium">({new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} ans)</span>}
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[8px] text-slate-400 uppercase font-black">Date:</span>
                    <span className="text-sm font-bold text-slate-800">{new Date(date).toLocaleDateString('fr-FR')}</span>
                </div>
            </div>
        </div>

        {/* Prescription Content */}
        <div className="flex-1 px-3 py-2 overflow-hidden">
            <h2 className="text-center font-black text-lg uppercase underline decoration-2 underline-offset-[6px] mb-6 tracking-[0.4em] text-slate-800">Ordonnance</h2>
            <div className="max-h-[105mm] overflow-hidden">
                <ul className="space-y-4">
                    {prescription.map((med, idx) => (
                    <li key={idx} className="text-[13px] text-slate-800 flex items-start">
                        <span className="font-black mr-4 text-slate-300 min-w-[15px]">{idx + 1}.</span> 
                        <span className="flex-1 border-b border-slate-50 pb-1 font-medium">{med}</span>
                    </li>
                    ))}
                    {prescription.length === 0 && (
                        <div className="space-y-8 opacity-5 mt-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <li key={i} className="border-b-2 border-slate-400 pb-1"></li>
                            ))}
                        </div>
                    )}
                </ul>
            </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto shrink-0 pt-3 border-t-2 border-slate-100">
            <div className="flex justify-between items-center mb-4 px-4">
                <div className="text-center border-2 border-slate-50 px-6 py-2 rounded-2xl bg-slate-50/30 flex-1 mr-4">
                    <p className="font-black text-slate-300 uppercase tracking-[0.3em] text-[7px]">Signature et Cachet</p>
                    <div className="h-10"></div>
                </div>
                {/* Code QR Section */}
                <div className="w-14 h-14 bg-white p-1 border border-slate-200 rounded-lg shadow-sm">
                    <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
                </div>
            </div>
            
            {/* Addresses Footer */}
            <div className="grid grid-cols-2 gap-6 text-[9.5px] text-slate-600 font-sans mb-1.5">
                <div className="text-left border-l-2 border-medical-500 pl-3">
                    <p className="font-bold text-slate-800">Imm. Damou, 1er étage, Route de Biougra, Ait Melloul</p>
                </div>
                <div className="text-right border-r-2 border-medical-500 pr-3 font-medium">
                    <p className="font-bold text-slate-800" dir="rtl">عمارة دامو الطابق الأول طريق بيوكرى أيت ملول</p>
                </div>
            </div>

            {/* Centered Phone (French only as requested) */}
            <div className="text-center mb-1">
                <p className="text-[9.5px] font-medium text-slate-700 font-sans">
                    Tél: 05 28 24 11 19 | GSM: 06 41 23 83 44
                </p>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 text-center text-[7px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                ICE: 003677364000081 • Email: cmhe25@gmail.com
            </div>
        </div>
    </div>
  );
};
