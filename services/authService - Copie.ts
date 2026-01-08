import { User, Role } from '../types';
import { DataService } from './dataService';

const AUTH_KEY = 'cmhe_user';

export const AuthService = {
  login: (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = DataService.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        let isValid = false;
        if (user) {
            // Check dynamic users or mock hardcoded passwords
            if (user.password && user.password === password) isValid = true;
            else if (user.role === Role.ADMIN && password === 'admin123') isValid = true;
            else if (user.role === Role.SECRETARY && password === 'sec123') isValid = true;
            else if (user.role === Role.DOCTOR && password === 'doc123') isValid = true;
            else if (user.role === Role.ASSISTANT && password === 'ast123') isValid = true;
        }

        if (user && isValid) {
          localStorage.setItem(AUTH_KEY, JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Email ou mot de passe incorrect'));
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
    
    // Refresh permissions from storage to ensure they are up to date
    const localUser = JSON.parse(stored) as User;
    const users = DataService.getUsers();
    const updatedUser = users.find(u => u.id === localUser.id);
    return updatedUser || localUser;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_KEY);
  }
};
