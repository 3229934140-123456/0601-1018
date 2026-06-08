import { create } from 'zustand';
import type {
  Service,
  Alert,
  AlertNote,
  AlertRule,
  SilenceRule,
  EscalationRule,
  Incident,
  PostmortemReport,
  DutyRecord,
  DutyPerson,
} from '../types';
import { services as initialServices } from '../data/services';
import { alerts as initialAlerts } from '../data/alerts';
import {
  alertRules as initialAlertRules,
  silenceRules as initialSilenceRules,
  escalationRules as initialEscalationRules,
} from '../data/settings';
import { incidents as initialIncidents } from '../data/incidents';
import { postmortemReports as initialPostmortemReports } from '../data/postmortem';
import {
  dutyRecords as initialDutyRecords,
  dutyPersons as initialDutyPersons,
} from '../data/duty';

interface AppState {
  services: Service[];
  alerts: Alert[];
  alertRules: AlertRule[];
  silenceRules: SilenceRule[];
  escalationRules: EscalationRule[];
  incidents: Incident[];
  postmortemReports: PostmortemReport[];
  dutyRecords: DutyRecord[];
  dutyPersons: DutyPerson[];

  toggleFavorite: (serviceId: string) => void;
  getServiceById: (id: string) => Service | undefined;
  get favoriteServices(): Service[];

  acknowledgeAlert: (alertId: string, person: string) => void;
  closeAlert: (alertId: string, person: string) => void;
  addAlertNote: (alertId: string, content: string, author: string) => void;
  get pendingAlerts(): Alert[];
  get criticalAlerts(): Alert[];

  toggleAlertRule: (id: string) => void;
  toggleSilenceRule: (id: string) => void;
  toggleEscalationRule: (id: string) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  services: initialServices,
  alerts: initialAlerts,
  alertRules: initialAlertRules,
  silenceRules: initialSilenceRules,
  escalationRules: initialEscalationRules,
  incidents: initialIncidents,
  postmortemReports: initialPostmortemReports,
  dutyRecords: initialDutyRecords,
  dutyPersons: initialDutyPersons,

  toggleFavorite: (serviceId: string) =>
    set((state) => ({
      services: state.services.map((service) =>
        service.id === serviceId
          ? { ...service, isFavorite: !service.isFavorite }
          : service
      ),
    })),

  getServiceById: (id: string) => get().services.find((s) => s.id === id),

  get favoriteServices() {
    return get().services.filter((s) => s.isFavorite);
  },

  acknowledgeAlert: (alertId: string, person: string) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              status: 'acknowledged',
              acknowledgedBy: person,
              acknowledgedAt: new Date(),
            }
          : alert
      ),
    })),

  closeAlert: (alertId: string, person: string) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              status: 'closed',
              closedBy: person,
              closedAt: new Date(),
            }
          : alert
      ),
    })),

  addAlertNote: (alertId: string, content: string, author: string) => {
    const newNote: AlertNote = {
      id: `note-${Date.now()}`,
      content,
      author,
      createdAt: new Date(),
    };
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId
          ? { ...alert, notes: [...alert.notes, newNote] }
          : alert
      ),
    }));
  },

  get pendingAlerts() {
    return get().alerts.filter((a) => a.status === 'pending');
  },

  get criticalAlerts() {
    return get().alerts.filter((a) => a.level === 'critical');
  },

  toggleAlertRule: (id: string) =>
    set((state) => ({
      alertRules: state.alertRules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      ),
    })),

  toggleSilenceRule: (id: string) =>
    set((state) => ({
      silenceRules: state.silenceRules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      ),
    })),

  toggleEscalationRule: (id: string) =>
    set((state) => ({
      escalationRules: state.escalationRules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      ),
    })),
}));
