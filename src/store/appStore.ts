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
  favoriteOrder: string[];

  toggleFavorite: (serviceId: string) => void;
  getServiceById: (id: string) => Service | undefined;
  get favoriteServices(): Service[];
  updateFavoriteOrder: (order: string[]) => void;

  acknowledgeAlert: (alertId: string, person: string) => void;
  closeAlert: (alertId: string, person: string) => void;
  addAlertNote: (alertId: string, content: string, author: string) => void;
  get pendingAlerts(): Alert[];
  get criticalAlerts(): Alert[];

  toggleAlertRule: (id: string) => void;
  addAlertRule: (rule: AlertRule) => void;
  updateAlertRule: (rule: AlertRule) => void;
  deleteAlertRule: (id: string) => void;

  toggleSilenceRule: (id: string) => void;
  addSilenceRule: (rule: SilenceRule) => void;
  updateSilenceRule: (rule: SilenceRule) => void;
  deleteSilenceRule: (id: string) => void;

  toggleEscalationRule: (id: string) => void;
  addEscalationRule: (rule: EscalationRule) => void;
  updateEscalationRule: (rule: EscalationRule) => void;
  deleteEscalationRule: (id: string) => void;

  addPostmortemReport: (report: PostmortemReport) => void;
  updatePostmortemReport: (report: PostmortemReport) => void;
  deletePostmortemReport: (id: string) => void;
  publishPostmortemReport: (id: string) => void;
}

const initialFavoriteOrder = initialServices
  .filter((s) => s.isFavorite)
  .map((s) => s.id);

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
  favoriteOrder: initialFavoriteOrder,

  toggleFavorite: (serviceId: string) =>
    set((state) => {
      const service = state.services.find((s) => s.id === serviceId);
      const isAdding = service && !service.isFavorite;

      let newFavoriteOrder = state.favoriteOrder;
      if (isAdding) {
        newFavoriteOrder = [...state.favoriteOrder, serviceId];
      } else {
        newFavoriteOrder = state.favoriteOrder.filter((id) => id !== serviceId);
      }

      return {
        services: state.services.map((service) =>
          service.id === serviceId
            ? { ...service, isFavorite: !service.isFavorite }
            : service
        ),
        favoriteOrder: newFavoriteOrder,
      };
    }),

  getServiceById: (id: string) => get().services.find((s) => s.id === id),

  get favoriteServices() {
    const order = get().favoriteOrder;
    const services = get().services;
    const serviceMap = new Map(services.map((s) => [s.id, s]));
    return order
      .map((id) => serviceMap.get(id))
      .filter((s): s is Service => s !== undefined && s.isFavorite);
  },

  updateFavoriteOrder: (order: string[]) =>
    set((state) => ({
      favoriteOrder: order,
    })),

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

  addAlertRule: (rule: AlertRule) =>
    set((state) => ({
      alertRules: [rule, ...state.alertRules],
    })),

  updateAlertRule: (rule: AlertRule) =>
    set((state) => ({
      alertRules: state.alertRules.map((r) => (r.id === rule.id ? rule : r)),
    })),

  deleteAlertRule: (id: string) =>
    set((state) => ({
      alertRules: state.alertRules.filter((r) => r.id !== id),
    })),

  addSilenceRule: (rule: SilenceRule) =>
    set((state) => ({
      silenceRules: [rule, ...state.silenceRules],
    })),

  updateSilenceRule: (rule: SilenceRule) =>
    set((state) => ({
      silenceRules: state.silenceRules.map((r) => (r.id === rule.id ? rule : r)),
    })),

  deleteSilenceRule: (id: string) =>
    set((state) => ({
      silenceRules: state.silenceRules.filter((r) => r.id !== id),
    })),

  addEscalationRule: (rule: EscalationRule) =>
    set((state) => ({
      escalationRules: [rule, ...state.escalationRules],
    })),

  updateEscalationRule: (rule: EscalationRule) =>
    set((state) => ({
      escalationRules: state.escalationRules.map((r) => (r.id === rule.id ? rule : r)),
    })),

  deleteEscalationRule: (id: string) =>
    set((state) => ({
      escalationRules: state.escalationRules.filter((r) => r.id !== id),
    })),

  addPostmortemReport: (report: PostmortemReport) =>
    set((state) => ({
      postmortemReports: [report, ...state.postmortemReports],
    })),

  updatePostmortemReport: (report: PostmortemReport) =>
    set((state) => ({
      postmortemReports: state.postmortemReports.map((r) => (r.id === report.id ? report : r)),
    })),

  deletePostmortemReport: (id: string) =>
    set((state) => ({
      postmortemReports: state.postmortemReports.filter((r) => r.id !== id),
    })),

  publishPostmortemReport: (id: string) =>
    set((state) => ({
      postmortemReports: state.postmortemReports.map((r) =>
        r.id === id ? { ...r, status: 'published', updatedAt: new Date() } : r
      ),
    })),
}));
