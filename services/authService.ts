import { User, Role, Permission } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const AUTH_KEY = 'cmhe_user';

export const AuthService = {
    async login(email: string, password: string): Promise<User> {
        if (!isSupabaseConfigured()) {
            console.error('Supabase non configuré');
            throw new Error('Service indisponible');
        }

        // 🔐 NORMALISATION EMAIL (CRITIQUE PROD)
        const normalizedEmail = email.trim().toLowerCase();

        // 🔎 Récupération utilisateur
        const { data, error } = await supabase!
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .limit(1);

        if (error) {
            console.error('Erreur Supabase SELECT users:', error);
            throw new Error('Erreur serveur');
        }

        if (!data || data.length === 0) {
            console.warn('Utilisateur introuvable:', normalizedEmail);
            throw new Error('Utilisateur introuvable');
        }

        const user = data[0] as User & { password?: string };

        // 🔑 Vérification mot de passe
        if (!user.password) {
            console.warn('Mot de passe manquant pour:', normalizedEmail);
            throw new Error('Mot de passe incorrect');
        }

        if (user.password !== password) {
            console.warn('Mot de passe incorrect pour:', normalizedEmail);
            throw new Error('Mot de passe incorrect');
        }

        // 🛡 Admin = accès total
        if (user.role === Role.ADMIN) {
            user.permissions = Object.values(Permission);
        }

        // 💾 Sauvegarde session
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));

        return user;
    },

    logout() {
        localStorage.removeItem(AUTH_KEY);
    },

    getCurrentUser(): User | null {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return null;

        try {
            const user = JSON.parse(raw) as User;

            // Sécurité : Admin garde tous les droits
            if (user.role === Role.ADMIN) {
                user.permissions = Object.values(Permission);
            }

            return user;
        } catch (e) {
            console.error('Erreur parsing session user', e);
            localStorage.removeItem(AUTH_KEY);
            return null;
        }
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem(AUTH_KEY);
    }
};
