import type { AlertRule, SilenceRule, EscalationRule } from '../types';

export const alertRules: AlertRule[] = [
  {
    id: 'rule-001',
    name: '响应时间超过3秒告警',
    metric: 'responseTime',
    condition: 'gt',
    threshold: 3000,
    duration: 60,
    level: 'critical',
    enabled: true,
    serviceIds: ['svc-order', 'svc-payment', 'svc-user']
  },
  {
    id: 'rule-002',
    name: '错误率超过5%告警',
    metric: 'errorRate',
    condition: 'gt',
    threshold: 5,
    duration: 120,
    level: 'critical',
    enabled: true,
    serviceIds: ['svc-order', 'svc-payment']
  },
  {
    id: 'rule-003',
    name: '可用性低于99%告警',
    metric: 'availability',
    condition: 'lt',
    threshold: 99,
    duration: 300,
    level: 'critical',
    enabled: true,
    serviceIds: ['svc-order', 'svc-payment', 'svc-user', 'svc-product']
  },
  {
    id: 'rule-004',
    name: 'QPS突增2倍告警',
    metric: 'qps',
    condition: 'gt',
    threshold: 2000,
    duration: 60,
    level: 'warning',
    enabled: true,
    serviceIds: ['svc-product', 'svc-user']
  },
  {
    id: 'rule-005',
    name: '响应时间超过1秒告警',
    metric: 'responseTime',
    condition: 'gt',
    threshold: 1000,
    duration: 300,
    level: 'warning',
    enabled: true,
    serviceIds: ['svc-product', 'svc-search', 'svc-recommend']
  },
  {
    id: 'rule-006',
    name: '错误率超过1%告警',
    metric: 'errorRate',
    condition: 'gt',
    threshold: 1,
    duration: 300,
    level: 'warning',
    enabled: true,
    serviceIds: ['svc-user', 'svc-product', 'svc-search']
  },
  {
    id: 'rule-007',
    name: '数据库CPU使用率超过80%',
    metric: 'dbCpuUsage',
    condition: 'gt',
    threshold: 80,
    duration: 120,
    level: 'warning',
    enabled: true,
    serviceIds: ['svc-order', 'svc-user']
  },
  {
    id: 'rule-008',
    name: '消息队列积压超过10000条',
    metric: 'mqBacklog',
    condition: 'gt',
    threshold: 10000,
    duration: 60,
    level: 'critical',
    enabled: true,
    serviceIds: ['svc-order', 'svc-logistics']
  },
  {
    id: 'rule-009',
    name: '缓存命中率低于80%',
    metric: 'cacheHitRate',
    condition: 'lt',
    threshold: 80,
    duration: 300,
    level: 'warning',
    enabled: false,
    serviceIds: ['svc-user', 'svc-product']
  },
  {
    id: 'rule-010',
    name: '接口调用次数异常告警',
    metric: 'apiCallCount',
    condition: 'eq',
    threshold: 0,
    duration: 300,
    level: 'info',
    enabled: true,
    serviceIds: ['svc-logistics', 'svc-notification']
  }
];

export const silenceRules: SilenceRule[] = [
  {
    id: 'silence-001',
    name: '日常维护时段静默',
    startTime: '02:00',
    endTime: '04:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    alertRuleIds: ['rule-004', 'rule-005', 'rule-006']
  },
  {
    id: 'silence-002',
    name: '周末低峰期静默',
    startTime: '00:00',
    endTime: '06:00',
    daysOfWeek: [0, 6],
    enabled: true,
    alertRuleIds: ['rule-004', 'rule-009']
  },
  {
    id: 'silence-003',
    name: '发布窗口期静默',
    startTime: '20:00',
    endTime: '22:00',
    daysOfWeek: [3],
    enabled: false,
    alertRuleIds: ['rule-001', 'rule-002', 'rule-003', 'rule-005', 'rule-006']
  }
];

export const escalationRules: EscalationRule[] = [
  {
    id: 'esc-001',
    name: '严重告警5分钟未响应升级',
    alertLevel: 'critical',
    waitTime: 5,
    notifyTo: ['tech-lead@example.com', 'admin@example.com'],
    channel: 'email',
    enabled: true
  },
  {
    id: 'esc-002',
    name: '严重告警15分钟未关闭电话升级',
    alertLevel: 'critical',
    waitTime: 15,
    notifyTo: ['13800138000', '13900139000'],
    channel: 'phone',
    enabled: true
  },
  {
    id: 'esc-003',
    name: '警告告警30分钟未响应升级',
    alertLevel: 'warning',
    waitTime: 30,
    notifyTo: ['team-lead@example.com'],
    channel: 'sms',
    enabled: true
  }
];
