export enum Role {
  ADMIN = 'Administrateur',
  DOCTOR = 'Médecin',
  SECRETARY = 'Secrétaire',
  ASSISTANT = 'Assistante'
}

export enum Permission {
  DASHBOARD = 'dashboard',
  PATIENTS = 'patients',
  IMPORT = 'import',
  AGENDA = 'agenda',
  CONSULTATIONS = 'consultations',
  PRESCRIPTIONS = 'prescriptions',
  BILLING = 'billing',
  FINANCE = 'finance',
  USERS = 'users',
  STATS = 'stats'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  permissions: Permission[];
  avatar?: string;
}

export enum AppointmentStatus {
  SCHEDULED = 'Planifié',
  CONFIRMED = 'Confirmé',
  COMPLETED = 'Terminé',
  CANCELLED = 'Annulé',
  NOSHOW = 'Absent'
}

export enum PaymentType {
  CASH = 'Espèces',
  CHECK = 'Chèque',
  CARD = 'Carte Bancaire',
  VIREMENT = 'Virement'
}

export type ExpenseCategory = 'FIXED' | 'CONSUMABLE' | 'SALARY' | 'EQUIPMENT' | 'TAX' | 'OTHER';

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  FIXED: 'Charges Fixes (Loyer, Eau, Elec)',
  CONSUMABLE: 'Consommables Médicaux',
  SALARY: 'Salaires & Primes',
  EQUIPMENT: 'Matériel & Maintenance',
  TAX: 'Taxes & Impôts',
  OTHER: 'Divers'
};

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  email: string;
  cin: string;
  insuranceType: 'CNSS' | 'CNOPS' | 'PRIVEE' | 'AUCUNE';
  insuranceNumber: string;
  address: string;
  medicalHistory: string[];
  allergies: string[];
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  durationMinutes: number;
  reason: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  prescription: string[];
  labRequests?: string[];
}

export interface Invoice {
  id: string;
  patientId: string;
  consultationId?: string;
  date: string;
  amount: number;
  status: 'PAID' | 'PENDING';
  paymentMethod: PaymentType;
  items: { description: string; price: number }[];
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  paymentMethod: PaymentType;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}
