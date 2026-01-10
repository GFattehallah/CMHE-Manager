
import { Patient, Appointment, Invoice, Consultation, Expense, User } from '../types';
import { MOCK_PATIENTS, MOCK_APPOINTMENTS, MOCK_INVOICES, MOCK_EXPENSES, MOCK_USERS } from '../constants';
import { supabase, isSupabaseConfigured } from './supabase';

const KEYS = {
  PATIENTS: 'cmhe_patients',
  APPOINTMENTS: 'cmhe_appointments',
  INVOICES: 'cmhe_invoices',
  CONSULTATIONS: 'cmhe_consultations',
  EXPENSES: 'cmhe_expenses',
  USERS: 'cmhe_users'
};

const getFromStorage = <T>(key: string, defaultData: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(stored);
  } catch (err) {
    console.warn(`Erreur de lecture Storage pour ${key}:`, err);
    return defaultData;
  }
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Erreur d'écriture Storage pour ${key}:`, err);
  }
};

export const DataService = {
  // --- UTILISATEURS ---
  getUsers: async (): Promise<User[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.from('users').select('*');
        if (!error && data) return data as User[];
      } catch (e) { console.error("Cloud Error (Users):", e); }
    }
    return getFromStorage(KEYS.USERS, MOCK_USERS);
  },
  saveUser: async (user: User) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('users').upsert(user); } catch (e) {}
    }
    const users = await DataService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) users[index] = user;
    else users.push(user);
    saveToStorage(KEYS.USERS, users);
  },
  deleteUser: async (id: string) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('users').delete().eq('id', id); } catch (e) {}
    }
    const users = (await DataService.getUsers()).filter(u => u.id !== id);
    saveToStorage(KEYS.USERS, users);
  },

  // --- PATIENTS ---
  getPatients: async (): Promise<Patient[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.from('patients').select('*');
        if (!error && data) return data as Patient[];
      } catch (e) { console.error("Cloud Error (Patients):", e); }
    }
    return getFromStorage(KEYS.PATIENTS, MOCK_PATIENTS);
  },
  savePatient: async (patient: Patient) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('patients').upsert(patient); } catch (e) {}
    }
    const patients = await DataService.getPatients();
    const index = patients.findIndex(p => p.id === patient.id);
    if (index >= 0) patients[index] = patient;
    else patients.push(patient);
    saveToStorage(KEYS.PATIENTS, patients);
  },
  deletePatient: async (id: string) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('patients').delete().eq('id', id); } catch (e) {}
    }
    const patients = (await DataService.getPatients()).filter(p => p.id !== id);
    saveToStorage(KEYS.PATIENTS, patients);
  },

  // --- RENDEZ-VOUS ---
  getAppointments: async (): Promise<Appointment[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.from('appointments').select('*');
        if (!error && data) return data as Appointment[];
      } catch (e) {}
    }
    return getFromStorage(KEYS.APPOINTMENTS, MOCK_APPOINTMENTS);
  },
  saveAppointment: async (apt: Appointment) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('appointments').upsert(apt); } catch (e) {}
    }
    const appts = await DataService.getAppointments();
    const index = appts.findIndex(a => a.id === apt.id);
    if (index >= 0) appts[index] = apt;
    else appts.push(apt);
    saveToStorage(KEYS.APPOINTMENTS, appts);
  },
  deleteAppointment: async (id: string) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('appointments').delete().eq('id', id); } catch (e) {}
    }
    const appts = (await DataService.getAppointments()).filter(a => a.id !== id);
    saveToStorage(KEYS.APPOINTMENTS, appts);
  },

  // --- FACTURES / RECETTES ---
  getInvoices: async (): Promise<Invoice[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.from('invoices').select('*');
        if (!error && data) return data as Invoice[];
      } catch (e) {}
    }
    return getFromStorage(KEYS.INVOICES, MOCK_INVOICES);
  },
  saveInvoice: async (inv: Invoice) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('invoices').upsert(inv); } catch (e) {}
    }
    const invoices = await DataService.getInvoices();
    const index = invoices.findIndex(i => i.id === inv.id);
    if (index >= 0) invoices[index] = inv;
    else invoices.push(inv);
    saveToStorage(KEYS.INVOICES, invoices);
  },
  deleteInvoice: async (id: string) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('invoices').delete().eq('id', id); } catch (e) {}
    }
    const current = getFromStorage(KEYS.INVOICES, MOCK_INVOICES);
    const updated = current.filter(i => i.id !== id);
    saveToStorage(KEYS.INVOICES, updated);
  },
  deleteInvoicesBulk: async (ids: string[]) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('invoices').delete().in('id', ids); } catch (e) {}
    }
    const current = getFromStorage(KEYS.INVOICES, MOCK_INVOICES);
    const updated = current.filter(i => !ids.includes(i.id));
    saveToStorage(KEYS.INVOICES, updated);
  },

  // --- CONSULTATIONS ---
  getConsultations: async (): Promise<Consultation[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.from('consultations').select('*');
        if (!error && data) return data as Consultation[];
      } catch (e) {}
    }
    return getFromStorage(KEYS.CONSULTATIONS, []);
  },
  saveConsultation: async (cons: Consultation) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('consultations').upsert(cons); } catch (e) {}
    }
    const consultations = await DataService.getConsultations();
    consultations.push(cons);
    saveToStorage(KEYS.CONSULTATIONS, consultations);
  },

  // --- DEPENSES ---
  getExpenses: async (): Promise<Expense[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.from('expenses').select('*');
        if (!error && data) return data as Expense[];
      } catch (e) {}
    }
    return getFromStorage(KEYS.EXPENSES, MOCK_EXPENSES);
  },
  saveExpense: async (exp: Expense) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('expenses').upsert(exp); } catch (e) {}
    }
    const expenses = await DataService.getExpenses();
    const index = expenses.findIndex(e => e.id === exp.id);
    if (index >= 0) expenses[index] = exp;
    else expenses.push(exp);
    saveToStorage(KEYS.EXPENSES, expenses);
  },
  deleteExpense: async (id: string) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('expenses').delete().eq('id', id); } catch (e) {}
    }
    const current = getFromStorage(KEYS.EXPENSES, MOCK_EXPENSES);
    const updated = current.filter(e => e.id !== id);
    saveToStorage(KEYS.EXPENSES, updated);
  },
  deleteExpensesBulk: async (ids: string[]) => {
    if (isSupabaseConfigured()) {
      try { await supabase!.from('expenses').delete().in('id', ids); } catch (e) {}
    }
    const current = getFromStorage(KEYS.EXPENSES, MOCK_EXPENSES);
    const updated = current.filter(e => !ids.includes(e.id));
    saveToStorage(KEYS.EXPENSES, updated);
  }
};
