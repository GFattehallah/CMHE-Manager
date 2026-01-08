import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Shield, Mail, Trash2, Edit2, CheckCircle2, 
  XCircle, Lock, Users as UsersIcon, ShieldCheck, Key
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { User, Role, Permission } from '../types';

const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.DASHBOARD]: 'Tableau de bord',
  [Permission.PATIENTS]: 'Dossiers Patients',
  [Permission.IMPORT]: 'Importation Excel',
  [Permission.AGENDA]: 'Agenda & RDV',
  [Permission.CONSULTATIONS]: 'Consultations',
  [Permission.PRESCRIPTIONS]: 'Ordonnances',
  [Permission.BILLING]: 'Saisie Facture (Nouveau)',
  [Permission.BILLING_VIEW]: 'Voir Historique Factures',
  [Permission.FINANCE]: 'Trésorerie & Finance',
  [Permission.USERS]: 'Gestion Utilisateurs',
  [Permission.STATS]: 'Voir Totaux & Chiffres (CA, Impayés)',
  // Fix: Added missing label for DMP_VIEW permission
  [Permission.DMP_VIEW]: 'Accès Dossier Médical Partagé (DMP)'
};

export const AccountManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    setUsers(DataService.getUsers());
  }, []);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Collect permissions from checkboxes
    const selectedPermissions: Permission[] = [];
    Object.values(Permission).forEach(p => {
        if (formData.get(`perm_${p}`)) selectedPermissions.push(p);
    });

    const newUser: User = {
      id: editingUser ? editingUser.id : `U-${Date.now()}`,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string || editingUser?.password || '123456',
      role: formData.get('role') as Role,
      permissions: selectedPermissions,
      avatar: (formData.get('name') as string).split(' ').map(n => n[0]).join('').toUpperCase()
    };

    DataService.saveUser(newUser);
    setUsers(DataService.getUsers());
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = (id: string) => {
    const currentUser = JSON.parse(localStorage.getItem('cmhe_user') || '{}');
    if (id === currentUser.id) {
        alert("Vous ne pouvez pas supprimer votre propre compte.");
        return;
    }
    if (window.confirm('Supprimer ce compte définitivement ?')) {
      DataService.deleteUser(id);
      setUsers(DataService.getUsers());
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
             <div className="p-2 bg-slate-900 rounded-xl text-white">
                <UsersIcon size={24} />
             </div>
             Gestion des Comptes
          </h1>
          <p className="text-slate-500 font-medium">Contrôlez les accès et les permissions de l'équipe</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="bg-medical-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-medical-100 hover:bg-medical-700 transition active:scale-95 font-bold"
        >
          <UserPlus size={20} /> Nouveau Compte
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="p-5 pl-8">Utilisateur</th>
              <th className="p-5">Rôle</th>
              <th className="p-5">Permissions actives</th>
              <th className="p-5 text-center pr-8">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition group">
                <td className="p-5 pl-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 border border-slate-200 uppercase">
                      {user.avatar || user.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{user.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1"><Mail size={12}/> {user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    user.role === Role.ADMIN ? 'bg-slate-900 text-white' : 
                    user.role === Role.DOCTOR ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-5">
                  <div className="flex flex-wrap gap-1 max-w-md">
                    {user.permissions.length === Object.values(Permission).length ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <ShieldCheck size={12}/> Accès Total
                        </span>
                    ) : (
                        user.permissions.slice(0, 3).map(p => (
                            <span key={p} className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-bold">
                                {PERMISSION_LABELS[p]}
                            </span>
                        ))
                    )}
                    {user.permissions.length > 3 && user.permissions.length !== Object.values(Permission).length && (
                        <span className="text-[9px] text-slate-400 font-bold">+{user.permissions.length - 3}</span>
                    )}
                    {user.permissions.length === 0 && (
                        <span className="text-[9px] text-rose-400 italic font-bold">Aucun droit</span>
                    )}
                  </div>
                </td>
                <td className="p-5 text-center pr-8">
                  <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border border-slate-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                {editingUser ? <Edit2 size={18}/> : <UserPlus size={18}/>}
                {editingUser ? 'Modifier le compte' : 'Créer un compte'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-3xl font-light hover:rotate-90 transition-transform">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nom Complet</label>
                  <input name="name" defaultValue={editingUser?.name} required placeholder="Dr. ..." className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900 font-bold"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Rôle</label>
                  <select name="role" defaultValue={editingUser?.role || Role.SECRETARY} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-bold">
                    {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email (Login)</label>
                  <input type="email" name="email" defaultValue={editingUser?.email} required className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-bold"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <Key size={12}/> Mot de passe
                  </label>
                  <input type="password" name="password" placeholder={editingUser ? "••••••••" : "Par défaut: 123456"} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-bold"/>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b pb-2">Droits d'accès & Permissions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.values(Permission).map(p => (
                        <label key={p} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                            <input 
                                type="checkbox" 
                                name={`perm_${p}`}
                                defaultChecked={editingUser?.permissions.includes(p) || false}
                                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                            />
                            <span className="text-[11px] font-bold text-slate-600">{PERMISSION_LABELS[p]}</span>
                        </label>
                    ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition">Annuler</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-slate-100 hover:bg-black transition active:scale-95">Enregistrer le compte</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
