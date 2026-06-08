export type ServiceStatus = 'healthy' | 'warning' | 'critical' | 'offline';

export interface Service {
  id: string;
  name: string;
  system: string;
  status: ServiceStatus;
  availability: number;
  avgResponseTime: number;
  errorRate: number;
  qps: number;
  isFavorite: boolean;
  dependencies: string[];
  dependents: string[];
}

export type AlertLevel = 'critical' | 'warning' | 'info';
export type AlertStatus = 'pending' | 'acknowledged' | 'closed';

export interface AlertNote {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  serviceId: string;
  serviceName: string;
  level: AlertLevel;
  status: AlertStatus;
  message: string;
  count: number;
  firstTriggered: Date;
  lastTriggered: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  closedBy?: string;
  closedAt?: Date;
  notes: AlertNote[];
}

export interface MetricDataPoint {
  timestamp: number;
  value: number;
}

export type MetricType = 'responseTime' | 'errorRate' | 'qps' | 'availability';

export interface MetricData {
  serviceId: string;
  metric: MetricType;
  data: MetricDataPoint[];
}

export type DutyShift = 'morning' | 'afternoon' | 'night';

export interface DutyPerson {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
}

export interface DutyRecord {
  date: string;
  shift: DutyShift;
  person: DutyPerson;
  handover?: string;
}

export type EventType = 'alert' | 'action' | 'deployment' | 'resolution';

export interface Event {
  id: string;
  timestamp: Date;
  type: EventType;
  title: string;
  description: string;
  serviceIds: string[];
  author?: string;
}

export type IncidentStatus = 'ongoing' | 'resolved';
export type IncidentSeverity = 'critical' | 'major' | 'minor';

export interface Incident {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  status: IncidentStatus;
  severity: IncidentSeverity;
  affectedServices: string[];
  events: Event[];
  impactScope: string;
}

export type PostmortemStatus = 'draft' | 'published';

export interface ActionItem {
  id: string;
  description: string;
  owner: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  note: string;
}

export interface PostmortemReport {
  id: string;
  incidentId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  status: PostmortemStatus;
  content: {
    summary: string;
    timeline: string;
    rootCause: string;
    impact: string;
    actionItems: ActionItem[];
    lessonsLearned: string;
  };
}

export type AlertCondition = 'gt' | 'lt' | 'eq';

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  duration: number;
  level: AlertLevel;
  enabled: boolean;
  serviceIds: string[];
}

export interface SilenceRule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  enabled: boolean;
  alertRuleIds: string[];
}

export type NotificationChannel = 'email' | 'sms' | 'phone';

export interface EscalationRule {
  id: string;
  name: string;
  alertLevel: 'critical' | 'warning';
  waitTime: number;
  notifyTo: string[];
  channel: NotificationChannel;
  enabled: boolean;
}
