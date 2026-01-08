import { Patient, Appointment, AppointmentStatus, Invoice, PaymentType, Expense, User, Role, Permission } from './types';

// Auth Users
export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Dr. Hasnaa El Malki',
    email: 'admin@cmhe.ma',
    role: Role.ADMIN,
    avatar: 'HM',
    permissions: Object.values(Permission)
  },
  {
    id: 'u2',
    name: 'Secrétaire Principale',
    email: 'secretaire@cmhe.ma',
    role: Role.SECRETARY,
    avatar: 'SP',
    permissions: [Permission.DASHBOARD, Permission.PATIENTS, Permission.AGENDA, Permission.BILLING, Permission.BILLING_VIEW, Permission.IMPORT, Permission.STATS]
  },
  {
    id: 'u3',
    name: 'Assistante Cabinet',
    email: 'assistante@cmhe.ma',
    role: Role.ASSISTANT,
    avatar: 'AC',
    permissions: [Permission.DASHBOARD, Permission.PATIENTS, Permission.AGENDA, Permission.BILLING] // Saisie seule par défaut
  },
  {
    id: 'u4',
    name: 'Dr. Remplaçant',
    email: 'medecin@cmhe.ma',
    role: Role.DOCTOR,
    avatar: 'DR',
    permissions: [Permission.DASHBOARD, Permission.PATIENTS, Permission.AGENDA, Permission.CONSULTATIONS, Permission.PRESCRIPTIONS]
  }
];

// Seed Data for Moroccan Context
export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    firstName: 'Amine',
    lastName: 'Benjelloun',
    birthDate: '1985-04-12',
    phone: '0661123456',
    email: 'amine.ben@example.com',
    cin: 'A123456',
    insuranceType: 'CNSS',
    insuranceNumber: '123456789',
    address: '12, Av Hassan II, Casablanca',
    medicalHistory: ['Hypertension', 'Asthme'],
    allergies: ['Pénicilline'],
    createdAt: '2023-01-15T10:00:00Z'
  },
  {
    id: 'p2',
    firstName: 'Fatima',
    lastName: 'El Amrani',
    birthDate: '1990-11-23',
    phone: '0663987654',
    email: 'fatima.ela@example.com',
    cin: 'BE98765',
    insuranceType: 'CNOPS',
    insuranceNumber: '987654321',
    address: '45, Rue des Far, Rabat',
    medicalHistory: ['Diabète Type 2'],
    allergies: [],
    createdAt: '2023-02-20T09:30:00Z'
  },
  {
    id: 'p3',
    firstName: 'Youssef',
    lastName: 'Chraibi',
    birthDate: '1978-08-05',
    phone: '0655443322',
    email: 'y.chraibi@example.com',
    cin: 'K456123',
    insuranceType: 'PRIVEE',
    insuranceNumber: 'AXA-885522',
    address: 'Villa 10, Hay Riad, Rabat',
    medicalHistory: [],
    allergies: ['Pollen'],
    createdAt: '2023-03-10T14:15:00Z'
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    patientId: 'p1',
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // Tomorrow
    durationMinutes: 30,
    reason: 'Suivi hypertension',
    status: AppointmentStatus.SCHEDULED
  }
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    patientId: 'p3',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    amount: 300,
    status: 'PAID',
    paymentMethod: PaymentType.CASH,
    items: [{ description: 'Consultation Généraliste', price: 300 }]
  }
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp1',
    date: new Date(new Date().setDate(1)).toISOString(),
    category: 'FIXED',
    amount: 4500,
    description: 'Loyer Cabinet',
    paymentMethod: PaymentType.VIREMENT
  }
];
