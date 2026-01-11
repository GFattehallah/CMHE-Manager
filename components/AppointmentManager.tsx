import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, X, Calendar, Clock, User, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { DataService } from '../services/dataService';
import { Appointment, Patient, AppointmentStatus } from '../types';

export const AppointmentManager: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const [appts, pats] = await Promise.all([
      DataService.getAppointments(),
      DataService.getPatients(),
    ]);
    setAppointments(Array.isArray(appts) ? appts : []);
    setPatients(Array.isArray(pats) ? pats : []);
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED: return '#10b981'; // Green
      case AppointmentStatus.SCHEDULED: return '#3b82f6'; // Blue
      case AppointmentStatus.COMPLETED: return '#8b5cf6'; // Purple
      case AppointmentStatus.CANCELLED: return '#ef4444'; // Red
      case AppointmentStatus.NOSHOW: return '#f59e0b'; // Orange
      default: return '#64748b';
    }
  };

  const events = useMemo(() => {
    return appointments.map(apt => {
      const patient = patients.find(p => p.id === apt.patientId);
      const startTime = new Date(apt.date);
      const endTime = new Date(startTime.getTime() + apt.durationMinutes * 60000);
      
      return {
        id: apt.id,
        title: patient ? `${patient.lastName} ${patient.firstName}` : 'Patient Inconnu',
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        backgroundColor: getStatusColor(apt.status),
        borderColor: getStatusColor(apt.status),
        extendedProps: { ...apt }
      };
    });
  }, [appointments, patients]);

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.date);
    setEditingAppointment(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (info: any) => {
    const apt = info.event.extendedProps as Appointment;
    setEditingAppointment(apt);
    setSelectedDate(new Date(apt.date));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const dateStr = formData.get('date') as string;
    const timeStr = formData.get('time') as string;
    const fullDate = new Date(`${dateStr}T${timeStr}`);

    const newAppointment: Appointment = {
      id: editingAppointment ? editingAppointment.id : Date.now().toString(),
      patientId: formData.get('patientId') as string,
      date: fullDate.toISOString(),
      durationMinutes: parseInt(formData.get('duration') as string),
      reason: formData.get('reason') as string,
      status: formData.get('status') as AppointmentStatus,
      notes: formData.get('notes') as string
    };

    await DataService.saveAppointment(newAppointment);
    await refreshData();
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (editingAppointment && window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      await DataService.deleteAppointment(editingAppointment.id);
      await refreshData();
      setIsModalOpen(false);
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Agenda & Rendez-vous</h1>
        <button 
          onClick={() => { setEditingAppointment(null); setSelectedDate(new Date()); setIsModalOpen(true); }}
          className="bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
        >
          <Plus size={20} /> Nouveau RDV
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex-1 overflow-hidden">
        <div className="h-full">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            locale="fr"
            firstDay={1}
            slotMinTime="08:00:00"
            slotMaxTime="19:00:00"
            allDaySlot={false}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="100%"
            slotDuration="00:15:00"
            nowIndicator={true}
            buttonText={{
              today: "Aujourd'hui",
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour'
            }}
          />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingAppointment ? 'Modifier le Rendez-vous' : 'Nouveau Rendez-vous'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <User size={16} /> Patient
                </label>
                <select 
                  name="patientId" 
                  required 
                  defaultValue={editingAppointment?.patientId}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medical-500 bg-white"
                >
                  <option value="">-- Sélectionner un patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.lastName} {p.firstName} - {p.cin}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Calendar size={16} /> Date
                  </label>
                  <input 
                    type="date" 
                    name="date" 
                    required
                    defaultValue={selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Clock size={16} /> Heure
                  </label>
                  <input 
                    type="time" 
                    name="time" 
                    required
                    defaultValue={selectedDate ? selectedDate.toTimeString().slice(0, 5) : "09:00"}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Duration & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Durée (min)</label>
                  <select name="duration" defaultValue={editingAppointment?.durationMinutes || 30} className="w-full p-2.5 border border-slate-300 rounded-lg">
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1h</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                  <select 
                    name="status" 
                    defaultValue={editingAppointment?.status || AppointmentStatus.SCHEDULED} 
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-medium"
                    style={{ color: editingAppointment ? getStatusColor(editingAppointment.status) : 'inherit' }}
                  >
                    {Object.values(AppointmentStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <FileText size={16} /> Motif
                </label>
                <input 
                  type="text" 
                  name="reason" 
                  required
                  defaultValue={editingAppointment?.reason}
                  placeholder="ex: Consultation de routine"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <AlertCircle size={16} /> Notes (optionnel)
                </label>
                <textarea 
                  name="notes" 
                  rows={2}
                  defaultValue={editingAppointment?.notes}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-4">
                {editingAppointment ? (
                  <button 
                    type="button" 
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition"
                  >
                    <Trash2 size={18} /> Supprimer
                  </button>
                ) : <div />}
                
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 shadow-md transition flex items-center gap-2"
                  >
                    <CheckCircle size={18} /> {editingAppointment ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};