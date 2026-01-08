import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertCircle, 
  Trash2, UserPlus, Search, Info, HelpCircle
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

  // Normalisation avancée pour comparer les en-têtes
  const normalize = (str: string) => 
    str.toLowerCase()
       .trim()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
       .replace(/[^a-z0-9]/g, "");    // Garde uniquement l'essentiel

  const parseExcelDate = (val: any): string => {
    if (!val) return '1990-01-01';
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    try {
      if (typeof val === 'number') {
        const date = new Date((val - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch (e) {
      console.warn("Date invalide:", val);
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
        
        // On récupère les données brute (tableau de tableaux) pour trouver la ligne d'en-tête si elle n'est pas en haut
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        // Trouver la ligne qui ressemble le plus à une ligne d'en-tête (contient "nom" ou "prenom")
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rawData.length, 10); i++) {
          const row = rawData[i];
          if (row.some(cell => {
            const c = normalize(String(cell || ''));
            return c === 'nom' || c === 'prenom' || c === 'patient' || c === 'nomcomplet';
          })) {
            headerRowIndex = i;
            break;
          }
        }

        // Re-extraire les données avec le bon header
        const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex }) as any[];

        if (data.length === 0) {
          setError("Aucune donnée lisible trouvée dans le fichier.");
          setIsLoading(false);
          return;
        }

        const mappedData: ImportPreview[] = data.map(row => {
          const keys = Object.keys(row);
          
          // Fonction de recherche intelligente par mot-clé
          const getVal = (keywords: string[]) => {
            const normalizedKeywords = keywords.map(k => normalize(k));
            // 1. Chercher une correspondance exacte (normalisée)
            let foundKey = keys.find(k => normalizedKeywords.includes(normalize(k)));
            // 2. Si non trouvé, chercher si la clé CONTIENT le mot clé (ex: "Nom du Patient" contient "Nom")
            if (!foundKey) {
              foundKey = keys.find(k => {
                const nk = normalize(k);
                return normalizedKeywords.some(kw => nk.includes(kw));
              });
            }
            return foundKey ? row[foundKey] : null;
          };

          // --- MAPPING IDENTITÉ (Priorité Absolue) ---
          let lastName = (getVal(['nom', 'nomfamille', 'lastname', 'surname']) || '').toString().trim().toUpperCase();
          let firstName = (getVal(['prenom', 'firstname', 'givenname', 'petitnom']) || '').toString().trim();
          
          // Si colonnes séparées vides, chercher colonne combinée
          if (!lastName || !firstName || lastName === firstName) {
             const fullName = (getVal(['nomprenom', 'nometprenom', 'nomcomplet', 'patient', 'fullname', 'identite', 'nomprenoms']) || '').toString().trim();
             if (fullName && fullName.length > 2) {
                const parts = fullName.split(/\s+/);
                if (parts.length >= 2) {
                   lastName = parts[0].toUpperCase();
                   firstName = parts.slice(1).join(' ');
                } else {
                   lastName = fullName.toUpperCase();
                   firstName = "-";
                }
             }
          }

          // Fallbacks si vraiment rien n'est trouvé
          if (!lastName || lastName.length < 2) lastName = "NOM À REMPLIR";
          if (!firstName || firstName.length < 1) firstName = "Prénom";

          // --- MAPPING AUTRES CHAMPS ---
          const insuranceStr = (getVal(['mutuelle', 'assurance', 'organisme', 'cnss', 'cnops']) || '').toString().toUpperCase();
          let insuranceType: any = 'AUCUNE';
          if (insuranceStr.includes('CNSS')) insuranceType = 'CNSS';
          else if (insuranceStr.includes('CNOPS')) insuranceType = 'CNOPS';
          else if (insuranceStr.includes('PRIVE') || insuranceStr.includes('AXA') || insuranceStr.includes('SAHAM') || insuranceStr.includes('RMA')) insuranceType = 'PRIVEE';

          const parseList = (val: any) => {
            if (!val) return [];
            return val.toString().split(/[;,/|\n]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          };

          return {
            lastName,
            firstName,
            birthDate: parseExcelDate(getVal(['naissance', 'nele', 'neele', 'dob', 'age', 'datenaissance'])),
            cin: (getVal(['cin', 'cnie', 'carte', 'identite', 'passport', 'id']) || '').toString().toUpperCase().trim(),
            phone: (getVal(['telephone', 'portable', 'contact', 'gsm', 'tel', 'mobile', 'num']) || '').toString().trim(),
            email: (getVal(['email', 'courriel', 'mail', 'adressemail']) || '').toString().trim().toLowerCase(),
            insuranceType,
            insuranceNumber: (getVal(['immatriculation', 'nomutuelle', 'police', 'affiliation', 'numimmat']) || '').toString().trim(),
            address: (getVal(['adresse', 'lieu', 'domicile', 'residence', 'ville', 'habitation']) || '').toString().trim(),
            medicalHistory: parseList(getVal(['antecedents', 'historique', 'maladies', 'passif', 'pathologies', 'atcd'])),
            allergies: parseList(getVal(['allergies', 'sensibilite', 'reaction', 'intolerance']))
          };
        });

        setPreviews(mappedData);
      } catch (err) {
        setError("Impossible de lire le fichier. Assurez-vous qu'il n'est pas protégé par mot de passe.");
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
    let imported = 0;
    let skipped = 0;

    previews.forEach(p => {
      const isDup = currentPatients.some(ep => 
        (p.cin && ep.cin === p.cin) || 
        (ep.lastName === p.lastName && ep.firstName === p.firstName && p.phone && ep.phone === p.phone)
      );

      if (!isDup) {
        DataService.savePatient({
          ...p,
          id: `P-IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          createdAt: new Date().toISOString()
        });
        imported++;
      } else {
        skipped++;
      }
    });

    setSuccess(`${imported} patients ajoutés. ${skipped} doublons ignorés.`);
    setPreviews([]);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-medical-600 rounded-xl text-white shadow-lg shadow-medical-200">
              <FileSpreadsheet size={28} />
            </div>
            Importation Intelligente
          </h1>
          <p className="text-slate-500 mt-1">Notre système analyse votre fichier et apparie les colonnes automatiquement.</p>
        </div>
        {previews.length > 0 && (
            <button 
                onClick={handleConfirmImport}
                className="bg-medical-600 text-white px-8 py-3 rounded-2xl hover:bg-medical-700 font-bold shadow-xl shadow-medical-200 flex items-center gap-2 transition-all active:scale-95"
            >
                <UserPlus size={20} /> Finaliser l'Importation ({previews.length})
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panneau latéral */}
        <div className="lg:col-span-1 space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center bg-white hover:border-medical-500 hover:bg-medical-50/50 transition-all cursor-pointer h-60 shadow-sm overflow-hidden"
          >
            <div className="w-16 h-16 bg-medical-100 rounded-2xl flex items-center justify-center text-medical-600 mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <p className="font-bold text-slate-800">Cliquer pour importer</p>
            <p className="text-[10px] text-slate-400 mt-2">Fichier Excel (.xlsx, .xls)</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xlsx, .xls" 
              className="hidden" 
            />
          </div>

          <div className="bg-medical-600 text-white p-5 rounded-3xl shadow-lg">
            <h3 className="font-bold flex items-center gap-2 text-sm mb-3">
              <Info size={16} /> Conseils
            </h3>
            <ul className="text-[11px] space-y-2 opacity-90 leading-relaxed">
              <li>• Assurez-vous que les <b>en-têtes</b> sont sur la première ligne.</li>
              <li>• Le système gère les colonnes <b>Nom</b> et <b>Prénom</b> séparées ou fusionnées.</li>
              <li>• Les doublons (même CIN) sont automatiquement filtrés.</li>
            </ul>
          </div>
        </div>

        {/* Tableau de Prévisualisation */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 Vérification des données détectées
                 {previews.length > 0 && <span className="bg-medical-100 text-medical-700 text-[10px] px-2 py-0.5 rounded-full">{previews.length} lignes</span>}
              </h3>
            </div>

            <div className="flex-1 overflow-x-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full p-20">
                  <div className="w-12 h-12 border-4 border-medical-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-500 font-medium">Analyse en cours...</p>
                </div>
              ) : previews.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="p-4">Patient (IDENTITÉ)</th>
                      <th className="p-4">CIN & Contact</th>
                      <th className="p-4">Couverture</th>
                      <th className="p-4">Dossier</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previews.map((p, idx) => (
                      <tr key={idx} className="hover:bg-medical-50/30 transition-colors">
                        <td className="p-4">
                          <div className={`font-bold ${p.lastName === 'NOM À REMPLIR' ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                            {p.lastName} {p.firstName}
                          </div>
                          <div className="text-[10px] text-slate-400">Né(e) le {new Date(p.birthDate).toLocaleDateString('fr-FR')}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-mono font-bold text-slate-700">{p.cin || '---'}</div>
                          <div className="text-slate-500">{p.phone || 'Pas de tél.'}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            p.insuranceType === 'CNSS' ? 'bg-orange-100 text-orange-700' :
                            p.insuranceType === 'CNOPS' ? 'bg-purple-100 text-purple-700' :
                            p.insuranceType === 'PRIVEE' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {p.insuranceType}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[120px]">{p.insuranceNumber || 'Immat. NC'}</div>
                        </td>
                        <td className="p-4">
                           <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {p.medicalHistory.length > 0 && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">Pathologies ({p.medicalHistory.length})</span>}
                              {p.allergies.length > 0 && <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">Allergies ({p.allergies.length})</span>}
                              {p.medicalHistory.length === 0 && p.allergies.length === 0 && <span className="text-slate-300 italic text-[10px]">Dossier vide</span>}
                           </div>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => setPreviews(previews.filter((_, i) => i !== idx))}
                            className="text-slate-300 hover:text-red-500 transition-colors p-2"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <FileSpreadsheet size={40} className="text-slate-200" />
                  </div>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">Veuillez charger un fichier Excel (.xlsx) pour commencer l'analyse.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm">
                <AlertCircle size={18} />
                <p className="font-semibold text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm">
                <CheckCircle2 size={18} />
                <p className="font-semibold text-sm">{success}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
