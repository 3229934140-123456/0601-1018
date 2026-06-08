import type { DutyPerson, DutyRecord, DutyShift } from '../types';

export const dutyPersons: DutyPerson[] = [
  {
    id: 'dp-001',
    name: '张伟',
    phone: '13800000001',
    email: 'zhangwei@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei',
  },
  {
    id: 'dp-002',
    name: '李娜',
    phone: '13800000002',
    email: 'lina@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina',
  },
  {
    id: 'dp-003',
    name: '王磊',
    phone: '13800000003',
    email: 'wanglei@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wanglei',
  },
  {
    id: 'dp-004',
    name: '刘芳',
    phone: '13800000004',
    email: 'liufang@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liufang',
  },
  {
    id: 'dp-005',
    name: '陈明',
    phone: '13800000005',
    email: 'chenming@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenming',
  },
];

const shifts: DutyShift[] = ['morning', 'afternoon', 'night'];

const handoverNotes: Record<DutyShift, string[]> = {
  morning: [
    '系统运行正常，无遗留告警',
    '昨夜凌晨有少量警告已处理',
    '交接时需关注订单量高峰即将到来',
    '数据库备份任务已完成',
  ],
  afternoon: [
    '午间流量平稳，无异常',
    '有两个低优先级告警待观察',
    '已完成日常巡检',
    '系统负载正常，交接顺利',
  ],
  night: [
    '晚间流量下降，系统平稳',
    '夜班注意监控批处理任务',
    '自动扩容已完成，无异常',
    '夜间告警已全部处理',
  ],
};

const generateDutyRecords = (): DutyRecord[] => {
  const records: DutyRecord[] = [];
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];

    shifts.forEach((shift, shiftIndex) => {
      const personIndex = (day + shiftIndex - 1) % dutyPersons.length;
      const person = dutyPersons[personIndex];
      const noteIndex = Math.floor(Math.random() * handoverNotes[shift].length);

      records.push({
        date: dateStr,
        shift,
        person,
        handover: handoverNotes[shift][noteIndex],
      });
    });
  }

  return records;
};

export const dutyRecords: DutyRecord[] = generateDutyRecords();
