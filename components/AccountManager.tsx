import React, { useState, useEffect } from 'react';
import {
    UserPlus, Mail, Trash2, Edit2,
    Users as UsersIcon, ShieldCheck, Key
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
    [Permission.BILLING]: 'Saisie Facture',
    [Permission.BILLING_VIEW]: 'Historique Factures',
    [Permission.FINANCE]: 'Trésorerie & Finance',
    [Permission.USERS]: 'Gestion Utilisateurs',
    [Permission.STATS]: 'Statistiques'
};

export const AccountManager: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const data = await DataService.getUsers();
        setUsers(Array.isArray(data) ? data : []);
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const permissions: Permission[] = [];
        Object.values(Permission).forEach(p => {
            if (formData.get(`perm_${p}`)) permissions.push(p);
        });

        const name = formData.get('name') as string;

        const user: User = {
            id: editingUser?.id ?? crypto.randomUUID(),
            name,
            email: formData.get('email') as string,
            password: (formData.get('password') as string) || editingUser?.password || '123456',
            role: formData.get('role') as Role,
            permissions,
            avatar: name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
        };

        await DataService.saveUser(user);
        await loadUsers();
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleDelete = async (id: string) => {
        const currentUserRaw = localStorage.getItem('cmhe_user');
        const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) as User : null;

        if (currentUser && currentUser.id === id) {
            alert("Vous ne pouvez pas supprimer votre propre compte.");
            return;
        }

        if (window.confirm('Supprimer ce compte définitivement ?')) {
            await DataService.deleteUser(id);
            await loadUsers();
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-xl text-white">
                        <UsersIcon size={24} />
                    </div>
                    Gestion des Comptes
                </h1>

                <button
                    onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                    className="bg-medical-600 text-white px-6 py-3 rounded-2xl font-bold shadow hover:bg-medical-700"
                >
                    <UserPlus size={18} className="inline mr-2" />
                    Nouveau Compte
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-3xl border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                    <tr>
                        <th className="p-5 text-left">Utilisateur</th>
                        <th className="p-5">Rôle</th>
                        <th className="p-5">Permissions</th>
                        <th className="p-5 text-center">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map(u => (
                        <tr key={u.id} className="border-t hover:bg-slate-50">
                            <td className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold">
                                        {u.avatar || u.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold">{u.name}</div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1">
                                            <Mail size={12} /> {u.email}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-5 text-sm font-bold">{u.role}</td>
                            <td className="p-5">
                                {u.permissions.length === Object.values(Permission).length ? (
                                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck size={14} /> Accès total
                    </span>
                                ) : (
                                    <span className="text-xs text-slate-400">
                      {u.permissions.length} permissions
                    </span>
                                )}
                            </td>
                            <td className="p-5 text-center">
                                <button
                                    onClick={() => { setEditingUser(u); setIsModalOpen(true); }}
                                    className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg mr-2"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(u.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                        {/* HEADER */}
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h2 className="font-black uppercase text-sm">
                                {editingUser ? 'Modifier le compte' : 'Créer un compte'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-3xl">&times;</button>
                        </div>

                        {/* FORM (SCROLLABLE) */}
                        <form
                            onSubmit={handleSave}
                            className="p-6 space-y-6 overflow-y-auto flex-1"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <input name="name" defaultValue={editingUser?.name} required placeholder="Nom complet"
                                       className="p-3 border rounded-xl font-bold" />
                                <select name="role" defaultValue={editingUser?.role || Role.SECRETARY}
                                        className="p-3 border rounded-xl font-bold">
                                    {Object.values(Role).map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input type="email" name="email" defaultValue={editingUser?.email} required
                                       placeholder="Email"
                                       className="p-3 border rounded-xl font-bold" />
                                <input type="password" name="password"
                                       placeholder={editingUser ? '••••••••' : '123456'}
                                       className="p-3 border rounded-xl font-bold" />
                            </div>

                            <div>
                                <div className="font-black text-xs mb-2">Permissions</div>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.values(Permission).map(p => (
                                        <label key={p} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                name={`perm_${p}`}
                                                defaultChecked={editingUser?.permissions.includes(p)}
                                            />
                                            {PERMISSION_LABELS[p]}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-100">
                                    Annuler
                                </button>
                                <button type="submit"
                                        className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-black">
                                    Enregistrer
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
};
