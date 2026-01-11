import React, { useState, useEffect } from 'react';
import { Search, Printer, Plus, FileText, Calendar, Eye, Pill, Download } from 'lucide-react';
import { DataService } from '../services/dataService';
import { Consultation, Patient } from '../types';
import { PrescriptionTemplate } from './PrescriptionTemplate';

export const PrescriptionManager: React.FC = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for printing/viewing
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isQuickPrescriptionOpen, setIsQuickPrescriptionOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [allConsultations, pats] = await Promise.all([
      DataService.getConsultations(),
      DataService.getPatients(),
    ]);
    const sorted = (Array.isArray(allConsultations) ? allConsultations : []).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setConsultations(sorted);
    setPatients(Array.isArray(pats) ? pats : []);
  };

  const getPatient = (id: string) => patients.find(p => p.id === id);

  // Filter logic
  const filteredConsultations = consultations.filter(c => {
    if (!c.prescription || c.prescription.length === 0) return false;
    const patient = getPatient(c.patientId);
    if (!patient) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.firstName.toLowerCase().includes(searchLower) ||
      c.prescription.some(med => med.toLowerCase().includes(searchLower))
    );
  });

  const handlePrint = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    // Allow React to render the template in the hidden print div, then print
    setTimeout(() => window.print(), 100);
  };

  const handleDownloadPDF = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    
    // Wait for render in the off-screen container then PDF
    setTimeout(() => {
        if (typeof (window as any).html2pdf === 'undefined') {
            alert("Erreur: Librairie PDF non chargée.");
            return;
        }
        const element = document.getElementById('pdf-render-target');
        const patient = getPatient(consultation.patientId);
        
        const opt = {
          margin: 0,
          filename: `Ordonnance_${patient?.lastName || 'Patient'}_${new Date(consultation.date).toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
        };
        
        (window as any).html2pdf().set(opt).from(element).save();
    }, 100);
  };

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Gestion des Ordonnances</h1>
        <button 
          onClick={() => setIsQuickPrescriptionOpen(true)}
          className="bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
        >
          <Plus size={20} /> Ordonnance Rapide
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher patient ou médicament..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-500 font-medium border-b border-slate-100 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 pl-6">Date</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Contenu (Aperçu)</th>
                <th className="p-4 text-center">Médicaments</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredConsultations.map(consult => {
                const patient = getPatient(consult.patientId);
                return (
                  <tr key={consult.id} className="hover:bg-slate-50 transition group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar size={16} className="text-slate-400" />
                        {new Date(consult.date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-slate-400 pl-6">
                        {new Date(consult.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="p-4">
                      {patient ? (
                        <div>
                          <div className="font-semibold text-slate-800">{patient.lastName} {patient.firstName}</div>
                          <div className="text-xs text-slate-500">{new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} ans</div>
                        </div>
                      ) : <span className="text-red-400">Patient supprimé</span>}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-600 truncate max-w-xs">
                        {consult.prescription[0]} {consult.prescription.length > 1 && `+ ${consult.prescription.length - 1} autres...`}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                         {consult.prescription.length}
                       </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => handleDownloadPDF(consult)}
                            className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition"
                            title="Télécharger PDF"
                        >
                            <Download size={20} />
                        </button>
                        <button 
                            onClick={() => handlePrint(consult)}
                            className="text-slate-400 hover:text-medical-600 p-2 rounded-full hover:bg-medical-50 transition"
                            title="Imprimer"
                        >
                            <Printer size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredConsultations.length === 0 && (
                  <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 flex flex-col items-center">
                          <FileText size={48} className="mb-4 opacity-20"/>
                          Aucune ordonnance trouvée.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Print Container */}
      <div className="print-only">
        {selectedConsultation && (
            <PrescriptionTemplate 
                patient={getPatient(selectedConsultation.patientId)}
                prescription={selectedConsultation.prescription}
                date={new Date(selectedConsultation.date)}
            />
        )}
      </div>

      {/* Off-screen PDF Render Container */}
      <div className="pdf-container">
        {selectedConsultation && (
            <div id="pdf-render-target">
                <PrescriptionTemplate 
                    patient={getPatient(selectedConsultation.patientId)}
                    prescription={selectedConsultation.prescription}
                    date={new Date(selectedConsultation.date)}
                />
            </div>
        )}
      </div>

      {/* Quick Prescription Modal */}
      {isQuickPrescriptionOpen && (
        <QuickPrescriptionModal 
            patients={patients} 
            onClose={() => setIsQuickPrescriptionOpen(false)} 
            onSave={async (consult) => {
                await DataService.saveConsultation(consult);
                loadData();
                setIsQuickPrescriptionOpen(false);
                handlePrint(consult);
            }}
        />
      )}
    </div>
  );
};

const QuickPrescriptionModal = ({ patients, onClose, onSave }: any) => {
    const [patientId, setPatientId] = useState('');
    const [meds, setMeds] = useState<string[]>(['']);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const validMeds = meds.filter(m => m.trim() !== '');
        if(!patientId || validMeds.length === 0) return;

        const newConsult: Consultation = {
            id: Date.now().toString(),
            patientId,
            appointmentId: 'quick',
            date: new Date().toISOString(),
            symptoms: 'Renouvellement Ordonnance / Rapide',
            diagnosis: 'Consultation Standard',
            notes: 'Ordonnance rapide',
            prescription: validMeds
        };
        onSave(newConsult);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">Ordonnance Rapide</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
                        <select 
                            required 
                            className="w-full p-2 border rounded-lg"
                            value={patientId}
                            onChange={e => setPatientId(e.target.value)}
                        >
                            <option value="">Sélectionner...</option>
                            {patients.map((p: Patient) => (
                                <option key={p.id} value={p.id}>{p.lastName} {p.firstName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Médicaments</label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {meds.map((med, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <span className="w-6 flex items-center justify-center text-slate-400 text-sm">{idx + 1}</span>
                                    <input 
                                        autoFocus={idx === meds.length - 1}
                                        value={med}
                                        onChange={(e) => {
                                            const newMeds = [...meds];
                                            newMeds[idx] = e.target.value;
                                            setMeds(newMeds);
                                        }}
                                        className="flex-1 p-2 border rounded-lg text-sm"
                                        placeholder="Médicament, dosage..."
                                    />
                                </div>
                            ))}
                            <button type="button" onClick={() => setMeds([...meds, ''])} className="text-sm text-medical-600 font-medium ml-8 hover:underline">+ Ajouter ligne</button>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                        <button type="submit" className="px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 flex items-center gap-2">
                            <Printer size={18} /> Enregistrer et Imprimer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
