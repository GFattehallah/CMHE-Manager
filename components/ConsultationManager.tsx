import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { GeminiService } from '../services/geminiService';
import { Patient, Consultation } from '../types';
import { Sparkles, Save, Printer, History, FileText, Activity, AlertCircle, Pill, Download, Eye, EyeOff } from 'lucide-react';
import { PrescriptionTemplate } from './PrescriptionTemplate';

export const ConsultationManager: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [consultationHistory, setConsultationHistory] = useState<Consultation[]>([]);
  
  // UI State
  const [showPreview, setShowPreview] = useState(false);

  // Form State
  const [symptoms, setSymptoms] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prescription, setPrescription] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState('');

  useEffect(() => {
    setPatients(DataService.getPatients());
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      const allConsultations = DataService.getConsultations();
      const patientHistory = allConsultations
        .filter(c => c.patientId === selectedPatientId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setConsultationHistory(patientHistory);
    } else {
      setConsultationHistory([]);
    }
  }, [selectedPatientId]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleAIAnalysis = async () => {
    if (!selectedPatient || !symptoms) return;
    setIsAnalyzing(true);
    
    const analysis = await GeminiService.analyzeSymptoms(symptoms, selectedPatient.medicalHistory);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const handleGeneratePrescription = async () => {
    if (!diagnosis) {
      alert("Veuillez entrer un diagnostic d'abord");
      return;
    }
    setIsAnalyzing(true);
    const meds = await GeminiService.generatePrescriptionSuggestion(diagnosis);
    setPrescription(meds);
    setIsAnalyzing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (typeof (window as any).html2pdf === 'undefined') {
        alert("Erreur: Librairie PDF non chargée.");
        return;
    }
    const element = document.getElementById('prescription-preview-content');
    const opt = {
      margin: 0,
      filename: `Ordonnance_${selectedPatient?.lastName || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };
    (window as any).html2pdf().set(opt).from(element).save();
  };

  const handleSave = () => {
    if (!selectedPatient) return;
    if (!diagnosis) {
        alert("Le diagnostic est obligatoire pour sauvegarder.");
        return;
    }

    const newConsultation: Consultation = {
      id: Date.now().toString(),
      patientId: selectedPatient.id,
      appointmentId: 'manual', 
      date: new Date().toISOString(),
      symptoms,
      diagnosis,
      notes: aiAnalysis,
      prescription
    };

    DataService.saveConsultation(newConsultation);
    
    // Refresh history
    setConsultationHistory([newConsultation, ...consultationHistory]);
    
    alert('Consultation sauvegardée avec succès !');
    
    // Reset form but keep patient selected
    setSymptoms('');
    setAiAnalysis('');
    setPrescription([]);
    setDiagnosis('');
    setActiveTab('history'); // Switch to history view to confirm save
  };

  return (
    <div className="p-6 flex flex-col lg:flex-row gap-6 h-[calc(100vh-80px)]">
      
      {/* LEFT PANEL: Controls & Inputs */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden no-print">
        
        {/* Header / Patient Selection */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
           <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Dossier Patient</label>
           <div className="flex gap-2">
            <select 
                className="flex-1 p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-medical-500 outline-none"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
            >
                <option value="">-- Rechercher un patient --</option>
                {patients.map(p => (
                <option key={p.id} value={p.id}>{p.lastName} {p.firstName} (Né le {new Date(p.birthDate).getFullYear()})</option>
                ))}
            </select>
            <button className="bg-white border border-slate-300 p-2 rounded-lg text-slate-500 hover:text-medical-600 hover:border-medical-600 transition">
                <History size={20}/>
            </button>
           </div>
           
           {selectedPatient && (
             <div className="mt-3 flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-slate-600">
                    <Activity size={14} className="text-red-500"/> 
                    Antécédents: <strong>{selectedPatient.medicalHistory.length ? selectedPatient.medicalHistory.join(', ') : 'Aucun'}</strong>
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                    <AlertCircle size={14} className="text-orange-500"/> 
                    Allergies: <strong>{selectedPatient.allergies.length ? selectedPatient.allergies.join(', ') : 'Aucune'}</strong>
                </span>
             </div>
           )}
        </div>

        {/* Tabs */}
        {selectedPatient ? (
        <>
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'new' ? 'text-medical-600 border-b-2 border-medical-600 bg-medical-50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <FileText size={16}/> Nouvelle Consultation
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'history' ? 'text-medical-600 border-b-2 border-medical-600 bg-medical-50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <History size={16}/> Historique ({consultationHistory.length})
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                
                {activeTab === 'new' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Symptoms Section */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Symptômes & Motif</label>
                            <textarea 
                                className="w-full p-3 border border-slate-200 rounded-lg h-24 focus:ring-2 focus:ring-medical-500 outline-none text-slate-700 resize-none"
                                placeholder="Le patient se plaint de..."
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                            />
                            <div className="mt-3 flex justify-end">
                                <button 
                                    onClick={handleAIAnalysis}
                                    disabled={isAnalyzing || !symptoms}
                                    className="text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                                >
                                    <Sparkles size={16} />
                                    {isAnalyzing ? 'Analyse...' : 'Analyser avec IA'}
                                </button>
                            </div>
                            
                            {/* AI Suggestion Box */}
                            {aiAnalysis && (
                                <div className="mt-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-sm text-slate-700 leading-relaxed">
                                    <div className="font-semibold text-indigo-800 mb-1 flex items-center gap-2"><Sparkles size={12}/> Suggestion Gemini</div>
                                    <div className="whitespace-pre-wrap">{aiAnalysis}</div>
                                </div>
                            )}
                        </div>

                        {/* Diagnosis Section */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Diagnostic</label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    placeholder="Diagnostic médical..."
                                />
                                <button 
                                    onClick={handleGeneratePrescription}
                                    className="bg-medical-50 text-medical-700 px-3 py-2 rounded-lg hover:bg-medical-100 transition"
                                    title="Suggérer ordonnance"
                                >
                                    <Pill size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Prescription Builder */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-700">Médicaments</label>
                                <button onClick={() => setPrescription([...prescription, ''])} className="text-xs text-medical-600 font-medium hover:underline">+ Ajouter</button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {prescription.map((med, idx) => (
                                <div key={idx} className="flex gap-2 group">
                                    <span className="w-6 flex items-center justify-center text-slate-300 text-xs">{idx + 1}</span>
                                    <input 
                                        value={med} 
                                        onChange={(e) => {
                                            const newPresc = [...prescription];
                                            newPresc[idx] = e.target.value;
                                            setPrescription(newPresc);
                                        }}
                                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:border-medical-500 outline-none"
                                        placeholder="Nom du médicament, dosage, fréquence..."
                                    />
                                    <button onClick={() => setPrescription(prescription.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                        &times;
                                    </button>
                                </div>
                                ))}
                                {prescription.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">Aucun médicament prescrit.</p>}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex gap-3">
                            <button onClick={handleSave} className="flex-1 bg-medical-600 text-white py-3 rounded-lg hover:bg-medical-700 shadow-md flex items-center justify-center gap-2 font-medium transition">
                                <Save size={18} /> Enregistrer
                            </button>
                            
                            <div className="h-full w-px bg-slate-200 mx-1"></div>

                            <button 
                                onClick={() => setShowPreview(!showPreview)} 
                                className={`px-4 py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 transition border ${showPreview ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                title={showPreview ? "Masquer l'aperçu" : "Voir l'aperçu"}
                            >
                                {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>

                            <button 
                                onClick={handleDownloadPDF} 
                                className="px-4 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 shadow-md flex items-center justify-center gap-2 transition"
                                title="Télécharger PDF"
                            >
                                <Download size={18} />
                            </button>
                            <button 
                                onClick={handlePrint} 
                                className="px-4 bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-900 shadow-md flex items-center justify-center gap-2 transition"
                                title="Imprimer"
                            >
                                <Printer size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4 animate-fade-in">
                        {consultationHistory.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <History size={48} className="mx-auto mb-2 opacity-20"/>
                                <p>Aucun historique de consultation.</p>
                            </div>
                        ) : (
                            consultationHistory.map((consult) => (
                                <div key={consult.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 text-medical-700 font-semibold">
                                            <CalendarIcon date={consult.date} />
                                            <span>{new Date(consult.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                            {new Date(consult.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="mb-3">
                                        <p className="text-sm text-slate-800 font-medium">Diagnostic: <span className="text-slate-600 font-normal">{consult.diagnosis}</span></p>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{consult.symptoms}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600">
                                        <div className="font-semibold mb-1 text-slate-500 uppercase tracking-wide">Traitement</div>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {consult.prescription.slice(0, 3).map((med, i) => (
                                                <li key={i}>{med}</li>
                                            ))}
                                            {consult.prescription.length > 3 && <li>...</li>}
                                        </ul>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <UserIcon />
                </div>
                <p className="text-lg font-medium text-slate-600">Aucun patient sélectionné</p>
                <p className="text-sm">Veuillez rechercher et sélectionner un patient ci-dessus pour commencer.</p>
            </div>
        )}
      </div>

      {/* RIGHT PANEL: LIVE PREVIEW (Visible only if showPreview is true) */}
      <div className={`${showPreview ? 'block' : 'hidden'} w-[148mm] shrink-0 bg-white shadow-xl p-0 overflow-hidden border border-slate-200 relative group transition-all duration-300`}>
         <div className="absolute top-2 right-2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 uppercase tracking-widest font-bold">Aperçu A5</div>
         
         <div className="h-full overflow-y-auto p-4 origin-top">
            <div id="prescription-preview-content">
                <PrescriptionTemplate 
                    patient={selectedPatient} 
                    prescription={prescription} 
                    date={new Date()} 
                />
            </div>
         </div>
      </div>
      
      {/* Hidden Print Container */}
      <div className="print-only">
         <PrescriptionTemplate 
            patient={selectedPatient} 
            prescription={prescription} 
            date={new Date()} 
         />
      </div>

    </div>
  );
};

// Helper Components
const CalendarIcon = ({ date }: { date: string }) => (
    <div className="flex flex-col items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
        <span className="text-[10px] font-bold uppercase">{new Date(date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
        <span className="text-lg font-bold leading-none">{new Date(date).getDate()}</span>
    </div>
);

const UserIcon = () => (
    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
