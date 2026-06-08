import type { Incident, Event, EventType, IncidentSeverity, IncidentStatus } from '../types';

const now = new Date();

const createDate = (daysAgo: number, hoursOffset: number = 0): Date => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() + hoursOffset);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
};

const events1: Event[] = [
  {
    id: 'evt-001-01',
    timestamp: createDate(3, -2),
    type: 'alert',
    title: '支付服务响应时间告警',
    description: '支付服务P99响应时间超过2秒阈值，触发严重告警',
    serviceIds: ['svc-003'],
    author: 'system',
  },
  {
    id: 'evt-001-02',
    timestamp: createDate(3, -1.5),
    type: 'alert',
    title: '订单服务错误率上升',
    description: '订单服务错误率上升至5%，关联支付服务异常',
    serviceIds: ['svc-002', 'svc-003'],
    author: 'system',
  },
  {
    id: 'evt-001-03',
    timestamp: createDate(3, -1.2),
    type: 'action',
    title: '值班人员介入排查',
    description: '张伟开始排查支付服务数据库连接池问题',
    serviceIds: ['svc-003'],
    author: '张伟',
  },
  {
    id: 'evt-001-04',
    timestamp: createDate(3, -0.8),
    type: 'action',
    title: '重启支付服务实例',
    description: '已确认是连接池泄漏，重启2个实例进行恢复',
    serviceIds: ['svc-003'],
    author: '张伟',
  },
  {
    id: 'evt-001-05',
    timestamp: createDate(3, -0.3),
    type: 'resolution',
    title: '服务恢复正常',
    description: '支付服务响应时间恢复正常，错误率下降至0.1%以下',
    serviceIds: ['svc-002', 'svc-003'],
    author: '张伟',
  },
];

const events2: Event[] = [
  {
    id: 'evt-002-01',
    timestamp: createDate(10, -5),
    type: 'deployment',
    title: '搜索服务版本发布',
    description: '搜索服务v2.3.1版本上线，优化搜索排序算法',
    serviceIds: ['svc-007'],
    author: '李娜',
  },
  {
    id: 'evt-002-02',
    timestamp: createDate(10, -4.5),
    type: 'alert',
    title: '搜索服务CPU使用率告警',
    description: '发布后搜索服务CPU使用率飙升至95%',
    serviceIds: ['svc-007'],
    author: 'system',
  },
  {
    id: 'evt-002-03',
    timestamp: createDate(10, -4.2),
    type: 'action',
    title: '紧急回滚版本',
    description: '确认新版本存在性能问题，执行回滚操作',
    serviceIds: ['svc-007'],
    author: '李娜',
  },
  {
    id: 'evt-002-04',
    timestamp: createDate(10, -3.5),
    type: 'resolution',
    title: '回滚完成，服务恢复',
    description: '回滚至v2.3.0版本，CPU使用率恢复至正常水平',
    serviceIds: ['svc-007'],
    author: '李娜',
  },
];

const events3: Event[] = [
  {
    id: 'evt-003-01',
    timestamp: createDate(15, -8),
    type: 'alert',
    title: '数据库主从延迟告警',
    description: 'MySQL主从复制延迟超过30秒',
    serviceIds: ['svc-004', 'svc-005'],
    author: 'system',
  },
  {
    id: 'evt-003-02',
    timestamp: createDate(15, -7.5),
    type: 'alert',
    title: '商品详情页加载缓慢',
    description: '大量用户反馈商品详情页加载时间超过5秒',
    serviceIds: ['svc-004'],
    author: 'system',
  },
  {
    id: 'evt-003-03',
    timestamp: createDate(15, -7),
    type: 'action',
    title: '切换读流量至主库',
    description: '临时将读请求切换到主库，缓解从库压力',
    serviceIds: ['svc-004', 'svc-005'],
    author: '王磊',
  },
  {
    id: 'evt-003-04',
    timestamp: createDate(15, -5),
    type: 'action',
    title: '重建从库索引',
    description: '发现从库索引损坏，正在重建索引',
    serviceIds: ['svc-004'],
    author: '王磊',
  },
  {
    id: 'evt-003-05',
    timestamp: createDate(15, -2),
    type: 'action',
    title: '恢复从库并切回流量',
    description: '索引重建完成，主从同步恢复，流量切回从库',
    serviceIds: ['svc-004', 'svc-005'],
    author: '王磊',
  },
  {
    id: 'evt-003-06',
    timestamp: createDate(15, -1),
    type: 'resolution',
    title: '数据库服务完全恢复',
    description: '主从同步正常，所有服务运行稳定',
    serviceIds: ['svc-004', 'svc-005'],
    author: '王磊',
  },
];

const events4: Event[] = [
  {
    id: 'evt-004-01',
    timestamp: createDate(22, -12),
    type: 'alert',
    title: '消息队列积压告警',
    description: 'Kafka消息队列积压量超过100万条',
    serviceIds: ['svc-006'],
    author: 'system',
  },
  {
    id: 'evt-004-02',
    timestamp: createDate(22, -11.5),
    type: 'action',
    title: '扩容消费者实例',
    description: '增加消息服务消费者实例数量，从4个扩容到12个',
    serviceIds: ['svc-006'],
    author: '刘芳',
  },
  {
    id: 'evt-004-03',
    timestamp: createDate(22, -8),
    type: 'resolution',
    title: '消息积压已消化',
    description: '经过数小时处理，消息积压量降至正常水平',
    serviceIds: ['svc-006'],
    author: '刘芳',
  },
];

const events5: Event[] = [
  {
    id: 'evt-005-01',
    timestamp: createDate(2, -1),
    type: 'alert',
    title: '网关服务5xx错误增加',
    description: '网关服务5xx错误率从0.01%上升至1.5%',
    serviceIds: ['svc-009'],
    author: 'system',
  },
  {
    id: 'evt-005-02',
    timestamp: createDate(2, -0.7),
    type: 'alert',
    title: '认证服务响应超时',
    description: '部分认证请求超时，影响用户登录',
    serviceIds: ['svc-010', 'svc-009'],
    author: 'system',
  },
  {
    id: 'evt-005-03',
    timestamp: createDate(2, -0.5),
    type: 'action',
    title: '启用降级策略',
    description: '临时启用认证服务降级，允许部分缓存请求直接通过',
    serviceIds: ['svc-010'],
    author: '陈明',
  },
  {
    id: 'evt-005-04',
    timestamp: createDate(2, -0.2),
    type: 'action',
    title: '扩容认证服务',
    description: '认证服务实例从6个扩容到15个',
    serviceIds: ['svc-010'],
    author: '陈明',
  },
];

export const incidents: Incident[] = [
  {
    id: 'inc-001',
    title: '支付服务连接池泄漏导致响应超时',
    startTime: createDate(3, -2),
    endTime: createDate(3, -0.3),
    status: 'resolved',
    severity: 'critical',
    affectedServices: ['svc-002', 'svc-003'],
    events: events1,
    impactScope: '影响约30%的支付订单，持续约1.5小时',
  },
  {
    id: 'inc-002',
    title: '搜索服务新版本性能问题导致CPU飙升',
    startTime: createDate(10, -5),
    endTime: createDate(10, -3.5),
    status: 'resolved',
    severity: 'major',
    affectedServices: ['svc-007'],
    events: events2,
    impactScope: '搜索功能响应缓慢，影响约60%用户搜索体验，持续约1.5小时',
  },
  {
    id: 'inc-003',
    title: '数据库从库索引损坏导致商品详情页加载缓慢',
    startTime: createDate(15, -8),
    endTime: createDate(15, -1),
    status: 'resolved',
    severity: 'critical',
    affectedServices: ['svc-004', 'svc-005'],
    events: events3,
    impactScope: '商品详情页加载缓慢，影响所有商品浏览用户，持续约7小时',
  },
  {
    id: 'inc-004',
    title: '大促活动导致消息队列积压',
    startTime: createDate(22, -12),
    endTime: createDate(22, -8),
    status: 'resolved',
    severity: 'minor',
    affectedServices: ['svc-006'],
    events: events4,
    impactScope: '消息通知延迟约20分钟，无业务功能不可用',
  },
  {
    id: 'inc-005',
    title: '认证服务流量突增导致登录困难',
    startTime: createDate(2, -1),
    status: 'ongoing',
    severity: 'major',
    affectedServices: ['svc-009', 'svc-010'],
    events: events5,
    impactScope: '部分用户登录失败或缓慢，正在处理中',
  },
];
