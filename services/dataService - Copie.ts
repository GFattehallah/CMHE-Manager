import { Patient, Appointment, Invoice, Consultation, Expense, User, Role, Permission } from '../types';
import { MOCK_PATIENTS, MOCK_APPOINTMENTS, MOCK_INVOICES, MOCK_EXPENSES, MOCK_USERS } from '../constants';

const KEYS = {
  PATIENTS: 'cmhe_patients',
  APPOINTMENTS: 'cmhe_appointments',
  INVOICES: 'cmhe_invoices',
  CONSULTATIONS: 'cmhe_consultations',
  EXPENSES: 'cmhe_expenses',
  USERS: 'cmhe_users'
};

const getFromStorage = <T>(key: string, defaultData: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    if (Array.isArray(defaultData)) {
      return [...defaultData] as unknown as T;
    }
    return defaultData;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaultData;
  }
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const DataService = {
  // Users
  getUsers: (): User[] => {
    const users = getFromStorage(KEYS.USERS, MOCK_USERS);
    // Ensure admin has all permissions
    return users.map(u => u.role === Role.ADMIN ? { ...u, permissions: Object.values(Permission) } : u);
  },
  saveUser: (user: User) => {
    const users = DataService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    saveToStorage(KEYS.USERS, users);
  },
  deleteUser: (id: string) => {
    const users = DataService.getUsers().filter(u => u.id !== id);
    saveToStorage(KEYS.USERS, users);
  },

  // Patients
  getPatients: (): Patient[] => getFromStorage(KEYS.PATIENTS, MOCK_PATIENTS),
  savePatient: (patient: Patient) => {
    const patients = DataService.getPatients();
    const index = patients.findIndex(p => p.id === patient.id);
    if (index >= 0) {
      patients[index] = patient;
    } else {
      patients.push(patient);
    }
    saveToStorage(KEYS.PATIENTS, patients);
  },
  deletePatient: (id: string) => {
    const patients = DataService.getPatients().filter(p => p.id !== id);
    saveToStorage(KEYS.PATIENTS, patients);
  },

  // Appointments
  getAppointments: (): Appointment[] => getFromStorage(KEYS.APPOINTMENTS, MOCK_APPOINTMENTS),
  saveAppointment: (apt: Appointment) => {
    const appts = DataService.getAppointments();
    const index = appts.findIndex(a => a.id === apt.id);
    if (index >= 0) {
      appts[index] = apt;
    } else {
      appts.push(apt);
    }
    saveToStorage(KEYS.APPOINTMENTS, appts);
  },
  deleteAppointment: (id: string) => {
    const appts = DataService.getAppointments().filter(a => a.id !== id);
    saveToStorage(KEYS.APPOINTMENTS, appts);
  },

  // Invoices
  getInvoices: (): Invoice[] => getFromStorage(KEYS.INVOICES, MOCK_INVOICES),
  saveInvoice: (inv: Invoice) => {
    const invoices = DataService.getInvoices();
    const index = invoices.findIndex(i => i.id === inv.id);
    if (index >= 0) {
      invoices[index] = inv;
    } else {
      invoices.push(inv);
    }
    saveToStorage(KEYS.INVOICES, invoices);
  },
  deleteInvoice: (id: string) => {
    const invoices = DataService.getInvoices().filter(i => i.id !== id);
    saveToStorage(KEYS.INVOICES, invoices);
  },

  // Consultations
  getConsultations: (): Consultation[] => getFromStorage(KEYS.CONSULTATIONS, []),
  saveConsultation: (cons: Consultation) => {
    const consultations = DataService.getConsultations();
    consultations.push(cons);
    saveToStorage(KEYS.CONSULTATIONS, consultations);
  },

  // Expenses
  getExpenses: (): Expense[] => getFromStorage(KEYS.EXPENSES, MOCK_EXPENSES),
  saveExpense: (exp: Expense) => {
    const expenses = DataService.getExpenses();
    const index = expenses.findIndex(e => e.id === exp.id);
    if (index >= 0) {
      expenses[index] = exp;
    } else {
      expenses.push(exp);
    }
    saveToStorage(KEYS.EXPENSES, expenses);
  },
  deleteExpense: (id: string) => {
    const currentExpenses = DataService.getExpenses();
    const updatedExpenses = currentExpenses.filter(e => e.id !== id);
    saveToStorage(KEYS.EXPENSES, updatedExpenses);
  }
};
