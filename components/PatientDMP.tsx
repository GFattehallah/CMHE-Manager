import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Shield, Phone, Mail, MapPin, Calendar, Activity, 
  AlertCircle, FileText, Pill, CreditCard, ChevronLeft, 
  Clock, Heart, Scale, Thermometer, ExternalLink, Hash
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import { Permission, Consultation, Invoice, Appointment } from '../types';

export const PatientDMP: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  const patient = useMemo(() => 
    DataService.getPatients().find(p => p.id === patientId), 
  [patientId]);

  const consultations = useMemo(() => 
    DataService.getConsultations().filter(c => c.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [patientId]);

  const invoices = useMemo(() => 
    DataService.getInvoices().filter(i => i.patientId === patientId),
  [patientId]);

  const appointments = useMemo(() => 
    DataService.getAppointments().filter(a => a.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [patientId]);

  if (!patient) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Patient introuvable</h2>
        <button onClick={() => navigate('/patients')} className="mt-4 text-medical-600 font-bold">Retour à la liste</button>
      </div>
    );
  }

  const canSeeMedical = currentUser?.permissions.includes(Permission.CONSULTATIONS);
  const canSeeBilling = currentUser?.permissions.includes(Permission.BILLING_VIEW);

  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header Actions */}
      <div className="flex justify-between items-center no-print">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition"
        >
          <ChevronLeft size={20} /> Retour
        </button>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-600 font-bold flex items-center gap-2 hover:bg-slate-50 transition">
             Imprimer Dossier
           </button>
           {canSeeMedical && (
             <button 
               onClick={() => navigate('/consultations')} 
               className="bg-medical-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-medical-100 hover:bg-medical-700 transition"
             >
               Nouvelle Consultation
             </button>
           )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Essential Profile */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
            <div className="w-24 h-24 bg-medical-50 text-medical-600 rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-4 border-4 border-white shadow-md">
              {patient.lastName[0]}{patient.firstName[0]}
            </div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
              {patient.lastName} {patient.firstName}
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
              CIN: {patient.cin} • Patient depuis {new Date(patient.createdAt).getFullYear()}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
               <div className="bg-slate-50 p-3 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Âge</p>
                 <p className="font-bold text-slate-800">{new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} ans</p>
               </div>
               <div className="bg-slate-50 p-3 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Mutuelle</p>
                 <p className={`font-black text-[10px] uppercase ${patient.insuranceType !== 'AUCUNE' ? 'text-medical-600' : 'text-slate-400'}`}>
                    {patient.insuranceType}
                 </p>
               </div>
            </div>

            <div className="mt-6 space-y-3 text-left">
               <div className="flex items-center gap-3 text-sm text-slate-600">
                 <Phone size={16} className="text-slate-400" /> {patient.phone}
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-600">
                 <Mail size={16} className="text-slate-400" /> {patient.email || 'Non renseigné'}
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-600">
                 <MapPin size={16} className="text-slate-400" /> {patient.address}
               </div>
            </div>
          </div>

          {/* Medical Identity Card */}
          <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Shield size={80}/></div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
              <Shield size={14}/> Profil Clinique
            </h3>
            
            <div className="space-y-6">
               <section>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Allergies</p>
                 <div className="flex flex-wrap gap-2">
                   {patient.allergies.length > 0 ? patient.allergies.map(a => (
                     <span key={a} className="bg-rose-500/20 text-rose-300 px-3 py-1 rounded-lg text-[10px] font-black border border-rose-500/30">
                       {a}
                     </span>
                   )) : <span className="text-xs text-slate-500 italic">Aucune allergie connue</span>}
                 </div>
               </section>

               <section>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Antécédents</p>
                 <ul className="space-y-2">
                   {patient.medicalHistory.map((h, i) => (
                     <li key={i} className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <Activity size={12} className="text-medical-500"/> {h}
                     </li>
                   ))}
                   {patient.medicalHistory.length === 0 && <li className="text-xs text-slate-500 italic">Aucun antécédent</li>}
                 </ul>
               </section>

               <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Groupe Sanguin</p>
                    <p className="text-lg font-black text-medical-400">{patient.bloodType || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Dernier Poids</p>
                    <p className="text-lg font-black text-slate-200">{patient.weight || '--'} kg</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Life Timeline & History */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-4">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Activity size={20}/></div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase">Consultations</p>
                 <p className="text-xl font-black text-slate-800">{consultations.length}</p>
               </div>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-4">
               <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CreditCard size={20}/></div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase">Total Versé</p>
                 <p className="text-xl font-black text-slate-800">{totalPaid} MAD</p>
               </div>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-4">
               <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><AlertCircle size={20}/></div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase">Reste à Payer</p>
                 <p className="text-xl font-black text-rose-600">{totalPending} MAD</p>
               </div>
            </div>
          </div>

          {/* Timeline of Care */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg flex items-center gap-2">
                 <Clock size={20} className="text-medical-600"/> Ligne de Vie Patient (Timeline)
               </h3>
               <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-400 uppercase tracking-widest">
                 {consultations.length + appointments.length} événements
               </span>
            </div>

            <div className="p-8 space-y-8 max-h-[700px] overflow-y-auto">
               {consultations.length === 0 && appointments.length === 0 ? (
                 <div className="text-center py-20 text-slate-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="font-bold uppercase tracking-widest text-sm">Aucun historique enregistré</p>
                 </div>
               ) : (
                 <div className="relative pl-8 border-l-2 border-slate-100 space-y-10">
                    {/* Merge and sort all events for a true timeline */}
                    {consultations.map(c => (
                      <div key={c.id} className="relative">
                         <div className="absolute -left-[41px] top-0 w-5 h-5 bg-medical-600 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                            <Activity size={8} className="text-white"/>
                         </div>
                         <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-medical-200 transition-all">
                            <div className="flex justify-between items-start mb-4">
                               <div>
                                  <span className="text-[9px] font-black uppercase text-medical-600 bg-medical-50 px-2 py-1 rounded-lg">Consultation</span>
                                  <h4 className="text-sm font-black text-slate-800 mt-2">Diagnostic: {c.diagnosis}</h4>
                               </div>
                               <div className="text-right">
                                  <p className="text-xs font-black text-slate-400">{new Date(c.date).toLocaleDateString('fr-FR')}</p>
                                  <p className="text-[9px] font-bold text-slate-300 uppercase">{new Date(c.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</p>
                               </div>
                            </div>
                            
                            {canSeeMedical ? (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Symptômes</p>
                                   <p className="text-xs text-slate-600 italic leading-relaxed">{c.symptoms}</p>
                                </div>
                                <div className="space-y-2">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Traitement</p>
                                   <div className="flex flex-wrap gap-1">
                                      {c.prescription.map((m, i) => (
                                        <span key={i} className="text-[9px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                                          {m}
                                        </span>
                                      ))}
                                   </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-slate-100 rounded-xl flex items-center gap-2 text-slate-400">
                                <Shield size={14} /> <span className="text-[10px] font-bold uppercase">Contenu médical protégé</span>
                              </div>
                            )}
                         </div>
                      </div>
                    ))}

                    {appointments.filter(a => !consultations.some(c => c.appointmentId === a.id)).map(a => (
                      <div key={a.id} className="relative">
                         <div className="absolute -left-[41px] top-0 w-5 h-5 bg-blue-100 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                            <Calendar size={8} className="text-blue-500"/>
                         </div>
                         <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex justify-between items-center">
                            <div className="flex items-center gap-4">
                               <div className="text-center w-12 py-2 bg-slate-50 rounded-xl">
                                  <p className="text-[8px] font-black text-slate-400 uppercase">{new Date(a.date).toLocaleString('fr-FR', {month:'short'})}</p>
                                  <p className="text-sm font-black text-slate-800">{new Date(a.date).getDate()}</p>
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rendez-vous • {a.status}</p>
                                  <p className="text-sm font-bold text-slate-700">{a.reason}</p>
                               </div>
                            </div>
                            <span className="text-xs font-black text-slate-300">{new Date(a.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</span>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

