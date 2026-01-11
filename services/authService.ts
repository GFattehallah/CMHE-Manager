import { User, Role, Permission } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const AUTH_KEY = 'cmhe_user';

export const AuthService = {
    async login(email: string, password: string): Promise<User> {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase non configuré');
        }

        // 1. Chercher l'utilisateur dans la table users
        const { data: users, error } = await supabase!
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1);

        if (error || !users || users.length === 0) {
            throw new Error('Utilisateur introuvable');
        }

        const user = users[0] as User & { password?: string };

        // 2. Vérification du mot de passe (simple, volontairement)
        if (!user.password || user.password !== password) {
            throw new Error('Mot de passe incorrect');
        }

        // 3. Admin = tous les droits
        if (user.role === Role.ADMIN) {
            user.permissions = Object.values(Permission);
        }

        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        return user;
    },

    logout() {
        localStorage.removeItem(AUTH_KEY);
    },

    getCurrentUser(): User | null {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return null;

        const user = JSON.parse(raw) as User;
        if (user.role === Role.ADMIN) {
            user.permissions = Object.values(Permission);
        }
        return user;
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem(AUTH_KEY);
    }
};
