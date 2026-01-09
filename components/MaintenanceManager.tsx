
import React, { useState } from 'react';
import { Download, Upload, Database, AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';
import { BackupService } from '../services/backupService';
import { isSupabaseConfigured } from '../services/supabase';

export const MaintenanceManager: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  
  // Vérification de la configuration Cloud
  const isCloud = isSupabaseConfigured();

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      await BackupService.exportAllData();
      setStatus({ type: 'success', message: 'Fichier de sauvegarde généré avec succès.' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Échec de la génération de la sauvegarde.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Attention : Cette action va fusionner les données du fichier avec votre base actuelle. Continuer ?")) {
        e.target.value = '';
        return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const result = await BackupService.importData(content);
        
        if (result.success) {
          setStatus({ type: 'success', message: `${result.count} entrées ont été synchronisées avec succès.` });
        } else {
          setStatus({ type: 'error', message: `Erreur lors de l'import : ${result.error}` });
        }
      } catch (err) {
        setStatus({ type: 'error', message: "Le fichier importé est invalide ou corrompu." });
      } finally {
        setIsProcessing(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
             <div className="p-2 bg-slate-900 rounded-xl text-white">
                <Database size={24} />
             </div>
             Maintenance & Migration
          </h1>
          <p className="text-slate-500 font-medium mt-1">Exportation et importation de l'historique complet du cabinet</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EXPORT CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-medical-300 transition-all">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-medical-50 group-hover:text-medical-600 transition-colors">
            <Download size={32} />
          </div>
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-2">Étape 1 : Exporter (Local)</h3>
          <p className="text-slate-500 text-sm mb-8 px-4">Utilisez ce bouton sur votre ordinateur actuel pour télécharger tout votre historique.</p>
          <button 
            onClick={handleExport}
            disabled={isProcessing}
            className="w-full py-4 bg-slate-100 text-slate-700 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw className="animate-spin" size={16}/> : <Download size={16}/>}
            Télécharger la sauvegarde (.json)
          </button>
        </div>

        {/* IMPORT CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-emerald-300 transition-all">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
            <Upload size={32} />
          </div>
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-2">Étape 2 : Importer (Cible)</h3>
          <p className="text-slate-500 text-sm mb-8 px-4">Importez votre fichier .json pour restaurer ou migrer vos données vers ce cabinet.</p>
          
          <label className={`w-full py-4 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition cursor-pointer flex items-center justify-center gap-2 ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700'}`}>
            <Database size={16}/>
            Choisir le fichier et importer
            <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled={isProcessing} />
          </label>
        </div>
      </div>

      {/* STATUS MESSAGES */}
      {status.type && (
        <div className={`p-6 rounded-[2rem] border animate-fade-in flex items-center gap-4 ${
            status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
            {status.type === 'success' ? <CheckCircle2 size={24}/> : <ShieldAlert size={24}/>}
            <div className="flex-1">
                <p className="font-black text-xs uppercase tracking-widest">{status.type === 'success' ? 'Opération réussie' : 'Erreur de procédure'}</p>
                <p className="text-sm font-medium opacity-80">{status.message}</p>
            </div>
            <button onClick={() => setStatus({type: null, message: ''})} className="text-xs font-bold underline">Fermer</button>
        </div>
      )}

      {/* WARNING CLOUD */}
      <div className={`p-6 rounded-[2rem] border flex items-start gap-4 transition-opacity ${isCloud ? 'border-indigo-100 bg-indigo-50/50' : 'border-amber-100 bg-amber-50'}`}>
          {isCloud ? <CheckCircle2 className="text-indigo-600 shrink-0" size={24} /> : <AlertTriangle className="text-amber-600 shrink-0" size={24} />}
          <div>
              <h4 className={`font-black text-xs uppercase tracking-widest mb-1 ${isCloud ? 'text-indigo-900' : 'text-amber-900'}`}>
                {isCloud ? 'Mode Cloud Activé' : 'Mode Stockage Local'}
              </h4>
              <p className={`text-xs font-medium leading-relaxed ${isCloud ? 'text-indigo-800/80' : 'text-amber-800/80'}`}>
                  {isCloud 
                    ? "Votre application est connectée à Supabase. Les données importées seront synchronisées sur le serveur distant." 
                    : "Attention : Supabase n'est pas configuré. Vos données sont actuellement limitées à ce navigateur local."}
              </p>
          </div>
      </div>
    </div>
  );
};
