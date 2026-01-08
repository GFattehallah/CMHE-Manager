import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataService } from '../services/dataService';
import { Patient } from '../types';

export const PatientManager: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setPatients(DataService.getPatients());
  }, []);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newPatient: Patient = {
      id: editingPatient ? editingPatient.id : Date.now().toString(),
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      birthDate: formData.get('birthDate') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      cin: formData.get('cin') as string,
      insuranceType: formData.get('insuranceType') as any,
      insuranceNumber: formData.get('insuranceNumber') as string,
      address: formData.get('address') as string,
      medicalHistory: (formData.get('medicalHistory') as string).split(',').map(s => s.trim()).filter(s => s),
      allergies: (formData.get('allergies') as string).split(',').map(s => s.trim()).filter(s => s),
      bloodType: formData.get('bloodType') as any,
      weight: formData.get('weight') as string,
      height: formData.get('height') as string,
      createdAt: editingPatient ? editingPatient.createdAt : new Date().toISOString()
    };

    DataService.savePatient(newPatient);
    setPatients(DataService.getPatients());
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Confirmer la suppression de ce patient ?')) {
      DataService.deletePatient(id);
      setPatients(DataService.getPatients());
    }
  };

  const filteredPatients = patients.filter(p => 
    p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Gestion Patients</h1>
        <button 
          onClick={() => { setEditingPatient(null); setIsModalOpen(true); }}
          className="bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={20} /> Nouveau Patient
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher par nom, prénom ou CIN..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="p-4">Patient</th>
                <th className="p-4">CIN</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Mutuelle</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map(patient => (
                <tr key={patient.id} className="hover:bg-slate-50 transition group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400">
                         {patient.lastName[0]}{patient.firstName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{patient.lastName.toUpperCase()} {patient.firstName}</div>
                        <div className="text-sm text-slate-500">{new Date(patient.birthDate).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{patient.cin}</td>
                  <td className="p-4 text-slate-600">
                    <div>{patient.phone}</div>
                    <div className="text-xs text-slate-400">{patient.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${patient.insuranceType === 'CNSS' ? 'bg-orange-100 text-orange-700' : 
                        patient.insuranceType === 'CNOPS' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                      {patient.insuranceType}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => navigate(`/dmp/${patient.id}`)}
                        className="p-2 text-medical-600 hover:bg-medical-50 rounded-lg flex items-center gap-1 font-bold text-xs"
                        title="Voir Dossier Médical Partagé"
                      >
                        <UserCircle size={18} /> DMP
                      </button>
                      <button 
                        onClick={() => { setEditingPatient(patient); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                         onClick={() => handleDelete(patient.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Aucun patient trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                {editingPatient ? 'Modifier Patient' : 'Nouveau Patient'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">Fermer</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                  <input name="firstName" defaultValue={editingPatient?.firstName} required className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                  <input name="lastName" defaultValue={editingPatient?.lastName} required className="w-full p-2 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date Naissance</label>
                  <input type="date" name="birthDate" defaultValue={editingPatient?.birthDate} required className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CIN</label>
                  <input name="cin" defaultValue={editingPatient?.cin} required className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Groupe Sanguin</label>
                  <select name="bloodType" defaultValue={editingPatient?.bloodType} className="w-full p-2 border rounded-lg">
                    <option value="">--</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input name="phone" defaultValue={editingPatient?.phone} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" name="email" defaultValue={editingPatient?.email} className="w-full p-2 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mutuelle</label>
                  <select name="insuranceType" defaultValue={editingPatient?.insuranceType || 'CNSS'} className="w-full p-2 border rounded-lg">
                    <option value="CNSS">CNSS</option>
                    <option value="CNOPS">CNOPS</option>
                    <option value="PRIVEE">Privée</option>
                    <option value="AUCUNE">Aucune</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">N° Immatriculation</label>
                  <input name="insuranceNumber" defaultValue={editingPatient?.insuranceNumber} className="w-full p-2 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Poids (kg)</label>
                  <input name="weight" defaultValue={editingPatient?.weight} className="w-full p-2 border rounded-lg" placeholder="ex: 75" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Taille (cm)</label>
                  <input name="height" defaultValue={editingPatient?.height} className="w-full p-2 border rounded-lg" placeholder="ex: 175" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <textarea name="address" defaultValue={editingPatient?.address} rows={2} className="w-full p-2 border rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Antécédents (séparés par des virgules)</label>
                <input name="medicalHistory" defaultValue={editingPatient?.medicalHistory.join(', ')} className="w-full p-2 border rounded-lg" placeholder="ex: Diabète, Hypertension" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Allergies (séparées par des virgules)</label>
                <input name="allergies" defaultValue={editingPatient?.allergies.join(', ')} className="w-full p-2 border rounded-lg" placeholder="ex: Pénicilline, Arachide" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
