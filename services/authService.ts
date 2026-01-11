import { User, Role, Permission } from '../types';
import { DataService } from './dataService';
import { MOCK_USERS } from '../constants';

const AUTH_KEY = 'cmhe_user';

export const AuthService = {
  login: (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          let users = await DataService.getUsers();

          // Si aucun utilisateur n'est retourné ou qu'aucun utilisateur ne correspond,
          // on bascule sur les utilisateurs de démonstration (MOCK_USERS)
          const findUser = (list: User[]) => list.find(u => u.email.toLowerCase() === email.toLowerCase());

          let user = findUser(users);
          if (!user) {
            users = MOCK_USERS;
            user = findUser(users) || undefined;
          }

          let isValid = false;
          if (user) {
            if (user.password && user.password === password) isValid = true;
            else if (user.role === Role.ADMIN && password === 'admin123') isValid = true;
            else if (user.role === Role.SECRETARY && password === 'sec123') isValid = true;
            else if (user.role === Role.DOCTOR && password === 'doc123') isValid = true;
            else if (user.role === Role.ASSISTANT && password === 'ast123') isValid = true;
          }

          if (user && isValid) {
            // Pour s'assurer que l'Admin a toujours tout
            if (user.role === Role.ADMIN) {
              user.permissions = Object.values(Permission);
            }
            localStorage.setItem(AUTH_KEY, JSON.stringify(user));
            resolve(user);
          } else {
            reject(new Error('Email ou mot de passe incorrect'));
          }
        } catch (error) {
          reject(error);
        }
      }, 800);
    });
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;
    
    try {
        const localUser = JSON.parse(stored) as User;
        
        // Si c'est l'admin (par rôle ou par email), on lui redonne tous les droits à la volée
        if (localUser.role === Role.ADMIN || localUser.email === 'admin@cmhe.ma') {
            return { 
              ...localUser, 
              permissions: Object.values(Permission) 
            };
        }

        return localUser;
    } catch {
        return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_KEY);
  }
};
