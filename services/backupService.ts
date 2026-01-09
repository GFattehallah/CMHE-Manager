import { DataService } from './dataService';

export const BackupService = {
  exportAllData: async () => {
    const data = {
      patients: await DataService.getPatients(),
      appointments: await DataService.getAppointments(),
      invoices: await DataService.getInvoices(),
      consultations: await DataService.getConsultations(),
      expenses: await DataService.getExpenses(),
      users: await DataService.getUsers(),
      exportDate: new Date().toISOString(),
      version: "1.0"
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_cabinet_medical_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  importData: async (jsonData: string): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
      const data = JSON.parse(jsonData);
      let count = 0;

      // Import Patients
      if (data.patients) {
        for (const p of data.patients) {
          await DataService.savePatient(p);
          count++;
        }
      }

      // Import Consultations
      if (data.consultations) {
        for (const c of data.consultations) {
          await DataService.saveConsultation(c);
          count++;
        }
      }

      // Import Appointments
      if (data.appointments) {
        for (const a of data.appointments) {
          await DataService.saveAppointment(a);
          count++;
        }
      }

      // Import Invoices
      if (data.invoices) {
        for (const i of data.invoices) {
          await DataService.saveInvoice(i);
          count++;
        }
      }

      // Import Expenses
      if (data.expenses) {
        for (const e of data.expenses) {
          await DataService.saveExpense(e);
          count++;
        }
      }

      return { success: true, count };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message };
    }
  }
};

