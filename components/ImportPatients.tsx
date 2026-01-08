import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertCircle, 
  Trash2, UserPlus, Info, FileUp, Database
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { Patient } from '../types';

interface ImportPreview extends Omit<Patient, 'id' | 'createdAt'> {}

export const ImportPatients: React.FC = () => {
  const [previews, setPreviews] = useState<ImportPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalisation pour comparer les en-têtes sans se soucier des accents ou de la casse
  const normalize = (str: string) => 
    str.toLowerCase()
       .trim()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
       .replace(/[^a-z0-9]/g, "");    // Garde uniquement l'essentiel

  const parseExcelDate = (val: any): string => {
    if (!val) return '1990-01-01';
    // Si c'est déjà une string formatée YYYY-MM-DD
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    
    try {
      // Cas des dates "Nombre" d'Excel
      if (typeof val === 'number') {
        const date = new Date((val - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      // Cas Date JS
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch (e) {
      console.warn("Date invalide détectée:", val);
    }
    return '1990-01-01';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Extraction en JSON
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          setError("Le fichier Excel semble vide.");
          setIsLoading(false);
          return;
        }

        const mappedData: ImportPreview[] = data.map(row => {
          const keys = Object.keys(row);
          
          // Fonction de recherche de valeur par mots-clés
          const getVal = (keywords: string[]) => {
            const normalizedKeywords = keywords.map(k => normalize(k));
            const foundKey = keys.find(k => normalizedKeywords.includes(normalize(k)));
            return foundKey ? row[foundKey] : null;
          };

          // Mapping selon votre format spécifié
          const insuranceRaw = (getVal(['mutuelle', 'assurance', 'type assurance']) || '').toString().toUpperCase();
          let insuranceType: Patient['insuranceType'] = 'AUCUNE';
          if (insuranceRaw.includes('CNSS')) insuranceType = 'CNSS';
          else if (insuranceRaw.includes('CNOPS')) insuranceType = 'CNOPS';
          else if (insuranceRaw.includes('PRIVE') || insuranceRaw.includes('AXA') || insuranceRaw.includes('SANLAM')) insuranceType = 'PRIVEE';

          // Fonction pour découper les listes par virgule (comme demandé)
          const parseList = (val: any) => {
            if (!val) return [];
            return val.toString().split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          };

          return {
            firstName: (getVal(['prenom', 'first name']) || 'Prénom').toString().trim(),
            lastName: (getVal(['nom', 'last name', 'nom de famille']) || 'NOM').toString().trim().toUpperCase(),
            birthDate: parseExcelDate(getVal(['date de naissance', 'naissance', 'dob', 'date naissance'])),
            cin: (getVal(['cin', 'cnie', 'carte identite', 'identite']) || '').toString().trim().toUpperCase(),
            phone: (getVal(['telephone', 'tel', 'phone', 'gsm', 'mobile']) || '').toString().trim(),
            email: (getVal(['email', 'mail', 'courriel']) || '').toString().trim().toLowerCase(),
            insuranceType,
            insuranceNumber: (getVal(['n immatriculation', 'immatriculation', 'numero mutuelle', 'n mutuelle', 'affiliation']) || '').toString().trim(),
            address: (getVal(['adresse', 'lieu residence', 'ville']) || '').toString().trim(),
            medicalHistory: parseList(getVal(['antecedents', 'historique medical', 'maladies', 'atcd'])),
            allergies: parseList(getVal(['allergies', 'intolerances']))
          };
        });

        setPreviews(mappedData);
      } catch (err) {
        setError("Erreur de lecture du fichier. Vérifiez qu'il s'agit bien d'un fichier Excel valide.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (previews.length === 0) return;
    setIsLoading(true);
    
    const currentPatients = DataService.getPatients();
    let importedCount = 0;
    let duplicateCount = 0;

    previews.forEach(p => {
      // Vérification des doublons par CIN ou Nom/Prénom/Tél
      const isDuplicate = currentPatients.some(ep => 
        (p.cin && ep.cin === p.cin) || 
        (ep.lastName === p.lastName && ep.firstName === p.firstName && ep.phone === p.phone)
      );

      if (!isDuplicate) {
        DataService.savePatient({
          ...p,
          id: `P-IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          createdAt: new Date().toISOString()
        });
        importedCount++;
      } else {
        duplicateCount++;
      }
    });

    setSuccess(`Importation réussie : ${importedCount} nouveaux patients ajoutés. ${duplicateCount} doublons ignorés.`);
    setPreviews([]);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl text-white">
              <FileUp size={28} />
            </div>
            Importation Excel
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Importation massive de vos dossiers patients existants.</p>
        </div>
        {previews.length > 0 && (
          <div className="flex gap-2">
            <button 
                onClick={() => setPreviews([])}
                className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl hover:bg-slate-200 font-bold transition"
            >
                Annuler
            </button>
            <button 
                onClick={handleConfirmImport}
                className="bg-medical-600 text-white px-8 py-3 rounded-2xl hover:bg-medical-700 font-bold shadow-xl shadow-medical-100 flex items-center gap-2 transition-all active:scale-95"
            >
                <Database size={20} /> Confirmer l'import ({previews.length})
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Colonne d'instructions */}
        <div className="lg:col-span-1 space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative border-4 border-dashed border-slate-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center bg-white hover:border-medical-500 hover:bg-medical-50/50 transition-all cursor-pointer shadow-sm"
          >
            <div className="w-20 h-20 bg-medical-100 rounded-3xl flex items-center justify-center text-medical-600 mb-4 group-hover:scale-110 transition-transform">
              <Upload size={40} />
            </div>
            <p className="font-black text-slate-800 text-center text-sm uppercase tracking-tighter">Choisir un fichier</p>
            <p className="text-[10px] text-slate-400 mt-2 font-bold">FORMATS: XLSX, XLS</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xlsx, .xls" 
              className="hidden" 
            />
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl">
            <h3 className="font-black flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400 mb-6">
              Colonnes supportées
            </h3>
            <div className="space-y-3">
               {[
                 'Prénom', 'Nom', 'Date de Naissance', 'CIN', 
                 'Téléphone', 'Email', 'Mutuelle', 'N° Immatriculation', 
                 'Adresse', 'Antécédents', 'Allergies'
               ].map(col => (
                 <div key={col} className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                    <CheckCircle2 size={12} className="text-emerald-500"/> {col}
                 </div>
               ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-[10px] text-slate-400 italic flex items-start gap-2">
                    <Info size={14} className="shrink-0"/>
                    Les colonnes "Antécédents" et "Allergies" doivent contenir des éléments séparés par des virgules.
                </p>
            </div>
          </div>
        </div>

        {/* Zone de prévisualisation */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                 <div className="w-12 h-12 border-4 border-medical-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p className="text-slate-600 font-black uppercase tracking-widest text-xs">Analyse des données...</p>
              </div>
            )}

            {previews.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="p-5 pl-8">Patient</th>
                      <th className="p-5">CIN / Contact</th>
                      <th className="p-5">Couverture</th>
                      <th className="p-5">Dossier Médical</th>
                      <th className="p-5 text-center pr-8">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {previews.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-5 pl-8">
                          <div className="font-black text-slate-900 text-sm uppercase tracking-tighter">
                            {p.lastName} {p.firstName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold">Né(e) le {new Date(p.birthDate).toLocaleDateString('fr-FR')}</div>
                        </td>
                        <td className="p-5">
                          <div className="font-bold text-slate-700">{p.cin || '---'}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{p.phone || 'Pas de tél.'}</div>
                        </td>
                        <td className="p-5">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                            p.insuranceType === 'CNSS' ? 'bg-orange-100 text-orange-700' :
                            p.insuranceType === 'CNOPS' ? 'bg-purple-100 text-purple-700' :
                            p.insuranceType === 'PRIVEE' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {p.insuranceType}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1 font-bold">{p.insuranceNumber || 'Sans immat.'}</div>
                        </td>
                        <td className="p-5">
                           <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {p.medicalHistory.length > 0 && <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-bold border border-blue-100">{p.medicalHistory.length} ATCD</span>}
                              {p.allergies.length > 0 && <span className="text-[9px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-md font-bold border border-rose-100">{p.allergies.length} Allergies</span>}
                              {p.medicalHistory.length === 0 && p.allergies.length === 0 && <span className="text-slate-300 italic text-[10px]">Dossier vierge</span>}
                           </div>
                        </td>
                        <td className="p-5 text-center pr-8">
                          <button 
                            onClick={() => setPreviews(previews.filter((_, i) => i !== idx))}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                  <FileSpreadsheet size={48} className="text-slate-200" />
                </div>
                <h2 className="text-xl font-black text-slate-300 uppercase tracking-widest">Aucune donnée chargée</h2>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2 font-medium">Glissez un fichier Excel ici ou utilisez le bouton à gauche pour commencer.</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm">
                <AlertCircle size={20} />
                <p className="font-bold text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm">
                <CheckCircle2 size={20} />
                <p className="font-bold text-sm">{success}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
