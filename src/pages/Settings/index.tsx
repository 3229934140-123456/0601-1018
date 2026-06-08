import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  BellOff,
  TrendingUp,
  Star,
  Plus,
  Edit2,
  Trash2,
  X,
  GripVertical,
  AlertCircle,
  Info,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  Settings2,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { cn } from '../../lib/utils';
import type { AlertRule, SilenceRule, EscalationRule, Service, AlertLevel, AlertCondition } from '../../types';

type TabType = 'alert' | 'silence' | 'escalation' | 'favorite';

const tabs = [
  { id: 'alert' as TabType, label: '告警规则', icon: AlertTriangle },
  { id: 'silence' as TabType, label: '静默时段', icon: BellOff },
  { id: 'escalation' as TabType, label: '升级通知', icon: TrendingUp },
  { id: 'favorite' as TabType, label: '收藏管理', icon: Star },
];

const levelConfig = {
  critical: { label: '严重', color: 'text-danger-500', bgColor: 'bg-danger-500/10', borderColor: 'border-danger-500/30' },
  warning: { label: '警告', color: 'text-warning-500', bgColor: 'bg-warning-500/10', borderColor: 'border-warning-500/30' },
  info: { label: '信息', color: 'text-primary-500', bgColor: 'bg-primary-500/10', borderColor: 'border-primary-500/30' },
};

const conditionLabels: Record<AlertCondition, string> = {
  gt: '大于',
  lt: '小于',
  eq: '等于',
};

const metricLabels: Record<string, string> = {
  responseTime: '响应时间',
  errorRate: '错误率',
  availability: '可用性',
  qps: 'QPS',
  dbCpuUsage: '数据库CPU使用率',
  mqBacklog: '消息队列积压',
  cacheHitRate: '缓存命中率',
  apiCallCount: '接口调用次数',
};

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const channelLabels: Record<string, string> = {
  email: '邮件',
  sms: '短信',
  phone: '电话',
};

const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  sms: MessageSquare,
  phone: Phone,
};

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: () => void;
}

function ToggleSwitch({ enabled, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50',
        enabled ? 'bg-primary-500' : 'bg-dark-700'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

interface GradientCardProps {
  children: React.ReactNode;
  className?: string;
}

function GradientCard({ children, className }: GradientCardProps) {
  return (
    <div className={cn('relative rounded-xl bg-dark-800/50 backdrop-blur-sm overflow-hidden', className)}>
      <div className="absolute inset-0 rounded-xl p-[1px] pointer-events-none">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500/20 via-transparent to-primary-500/5 opacity-50" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-dark-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-dark-800 border border-dark-600/50 rounded-xl shadow-2xl animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-600/50">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}

interface AlertRuleFormProps {
  rule?: AlertRule | null;
  onSave: (rule: AlertRule) => void;
  onCancel: () => void;
}

function AlertRuleForm({ rule, onSave, onCancel }: AlertRuleFormProps) {
  const services = useAppStore((s) => s.services);
  const [formData, setFormData] = useState<Partial<AlertRule>>({
    name: rule?.name || '',
    metric: rule?.metric || 'responseTime',
    condition: rule?.condition || 'gt',
    threshold: rule?.threshold ?? 1000,
    duration: rule?.duration ?? 60,
    level: rule?.level || 'warning',
    enabled: rule?.enabled ?? true,
    serviceIds: rule?.serviceIds || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.threshold === undefined) return;

    const savedRule: AlertRule = {
      id: rule?.id || `rule-${Date.now()}`,
      name: formData.name!,
      metric: formData.metric!,
      condition: formData.condition!,
      threshold: formData.threshold!,
      duration: formData.duration!,
      level: formData.level as AlertLevel,
      enabled: formData.enabled!,
      serviceIds: formData.serviceIds || [],
    };
    onSave(savedRule);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-dark-300 mb-1.5">规则名称</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="请输入规则名称"
          className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">指标</label>
          <select
            value={formData.metric}
            onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-primary-500/50"
          >
            {Object.entries(metricLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">告警级别</label>
          <select
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value as AlertLevel })}
            className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-primary-500/50"
          >
            <option value="critical">严重</option>
            <option value="warning">警告</option>
            <option value="info">信息</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">条件</label>
          <select
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value as AlertCondition })}
            className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-primary-500/50"
          >
            <option value="gt">大于</option>
            <option value="lt">小于</option>
            <option value="eq">等于</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">阈值</label>
          <input
            type="number"
            value={formData.threshold}
            onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-primary-500/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-dark-300 mb-1.5">持续时间（秒）</label>
        <input
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-primary-500/50"
        />
      </div>

      <div>
        <label className="block text-sm text-dark-300 mb-2">适用服务</label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 rounded-lg bg-dark-700/30 border border-dark-600/30">
          {services.map((service) => (
            <label key={service.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-dark-700/50">
              <input
                type="checkbox"
                checked={formData.serviceIds?.includes(service.id)}
                onChange={(e) => {
                  const ids = formData.serviceIds || [];
                  if (e.target.checked) {
                    setFormData({ ...formData, serviceIds: [...ids, service.id] });
                  } else {
                    setFormData({ ...formData, serviceIds: ids.filter((id) => id !== service.id) });
                  }
                }}
                className="rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500/50"
              />
              <span className="text-sm text-dark-200">{service.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-dark-300">启用状态</span>
        <ToggleSwitch
          enabled={formData.enabled ?? true}
          onChange={() => setFormData({ ...formData, enabled: !formData.enabled })}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg bg-dark-700/50 border border-dark-600/50 text-dark-200 hover:bg-dark-700 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-colors"
        >
          保存
        </button>
      </div>
    </form>
  );
}

interface SilenceRuleFormProps {
  rule?: SilenceRule | null;
  alertRules: AlertRule[];
  onSave: (rule: SilenceRule) => void;
  onCancel: () => void;
}

function SilenceRuleForm({ rule, alertRules, onSave, onCancel }: SilenceRuleFormProps) {
  const [formData, setFormData] = useState<Partial<SilenceRule>>({
    name: rule?.name || '',
    startTime: rule?.startTime || '00:00',
    endTime: rule?.endTime || '06:00',
    daysOfWeek: rule?.daysOfWeek || [0, 6],
    enabled: rule?.enabled ?? true,
    alertRuleIds: rule?.alertRuleIds || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const savedRule: SilenceRule = {
      id: rule?.id || `silence-${Date.now()}`,
      name: formData.name!,
      startTime: formData.startTime!,
      endTime: formData.endTime!,
      daysOfWeek: formData.daysOfWeek || [],
      enabled: formData.enabled!,
      alertRuleIds: formData.alertRuleIds || [],
    };
    onSave(savedRule);
  };

  const toggleDay = (day: number) => {
    const days = formData.daysOfWeek || [];
    if (days.includes(day)) {
      setFormData({ ...formData, daysOfWeek: days.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, daysOfWeek: [...days, day].sort() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-dark-300 mb-1.5">规则名称</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="请输入规则名称"
          className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">开始时间</label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-primary-500/50"
          />
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">结束时间</label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-primary-500/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-dark-300 mb-2">适用星期</label>
        <div className="flex gap-2">
          {weekDays.map((day, index) => (
            <button
              key={index}
              type="button"
              onClick={() => toggleDay(index)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-colors border',
                formData.daysOfWeek?.includes(index)
                  ? 'bg-primary-500/20 border-primary-500/30 text-primary-400'
                  : 'bg-dark-700/30 border-dark-600/30 text-dark-400 hover:bg-dark-700/50'
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-dark-300 mb-2">适用告警规则</label>
        <div className="space-y-1 max-h-40 overflow-y-auto p-2 rounded-lg bg-dark-700/30 border border-dark-600/30">
          {alertRules.map((alertRule) => (
            <label key={alertRule.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-dark-700/50">
              <input
                type="checkbox"
                checked={formData.alertRuleIds?.includes(alertRule.id)}
                onChange={(e) => {
                  const ids = formData.alertRuleIds || [];
                  if (e.target.checked) {
                    setFormData({ ...formData, alertRuleIds: [...ids, alertRule.id] });
                  } else {
                    setFormData({ ...formData, alertRuleIds: ids.filter((id) => id !== alertRule.id) });
                  }
                }}
                className="rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500/50"
              />
              <span className="text-sm text-dark-200">{alertRule.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-dark-300">启用状态</span>
        <ToggleSwitch
          enabled={formData.enabled ?? true}
          onChange={() => setFormData({ ...formData, enabled: !formData.enabled })}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg bg-dark-700/50 border border-dark-600/50 text-dark-200 hover:bg-dark-700 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-colors"
        >
          保存
        </button>
      </div>
    </form>
  );
}

interface EscalationRuleFormProps {
  rule?: EscalationRule | null;
  onSave: (rule: EscalationRule) => void;
  onCancel: () => void;
}

function EscalationRuleForm({ rule, onSave, onCancel }: EscalationRuleFormProps) {
  const [formData, setFormData] = useState<Partial<EscalationRule>>({
    name: rule?.name || '',
    alertLevel: rule?.alertLevel || 'critical',
    waitTime: rule?.waitTime ?? 5,
    channel: rule?.channel || 'email',
    notifyTo: rule?.notifyTo || [''],
    enabled: rule?.enabled ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const savedRule: EscalationRule = {
      id: rule?.id || `esc-${Date.now()}`,
      name: formData.name!,
      alertLevel: formData.alertLevel as 'critical' | 'warning',
      waitTime: formData.waitTime!,
      channel: formData.channel!,
      notifyTo: formData.notifyTo?.filter((s) => s.trim()) || [],
      enabled: formData.enabled!,
    };
    onSave(savedRule);
  };

  const addNotifyTo = () => {
    setFormData({ ...formData, notifyTo: [...(formData.notifyTo || []), ''] });
  };

  const updateNotifyTo = (index: number, value: string) => {
    const list = [...(formData.notifyTo || [])];
    list[index] = value;
    setFormData({ ...formData, notifyTo: list });
  };

  const removeNotifyTo = (index: number) => {
    const list = formData.notifyTo?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, notifyTo: list.length > 0 ? list : [''] });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-dark-300 mb-1.5">规则名称</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="请输入规则名称"
          className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">告警级别</label>
          <select
            value={formData.alertLevel}
            onChange={(e) => setFormData({ ...formData, alertLevel: e.target.value as 'critical' | 'warning' })}
            className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-primary-500/50"
          >
            <option value="critical">严重</option>
            <option value="warning">警告</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-dark-300 mb-1.5">等待时间（分钟）</label>
          <input
            type="number"
            value={formData.waitTime}
            onChange={(e) => setFormData({ ...formData, waitTime: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-primary-500/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-dark-300 mb-1.5">通知方式</label>
        <div className="flex gap-2">
          {(['email', 'sms', 'phone'] as const).map((ch) => {
            const ChannelIcon = channelIcons[ch];
            return (
              <button
                key={ch}
                type="button"
                onClick={() => setFormData({ ...formData, channel: ch })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                  formData.channel === ch
                    ? 'bg-primary-500/20 border-primary-500/30 text-primary-400'
                    : 'bg-dark-700/30 border-dark-600/30 text-dark-400 hover:bg-dark-700/50'
                )}
              >
                <ChannelIcon className="w-4 h-4" />
                {channelLabels[ch]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-dark-300">通知人</label>
          <button
            type="button"
            onClick={addNotifyTo}
            className="text-xs text-primary-400 hover:text-primary-300"
          >
            + 添加
          </button>
        </div>
        <div className="space-y-2">
          {formData.notifyTo?.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateNotifyTo(index, e.target.value)}
                placeholder={formData.channel === 'email' ? '邮箱地址' : formData.channel === 'phone' ? '电话号码' : '手机号'}
                className="flex-1 px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50"
              />
              {formData.notifyTo && formData.notifyTo.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeNotifyTo(index)}
                  className="p-2 rounded-lg text-danger-400 hover:bg-danger-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-dark-300">启用状态</span>
        <ToggleSwitch
          enabled={formData.enabled ?? true}
          onChange={() => setFormData({ ...formData, enabled: !formData.enabled })}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg bg-dark-700/50 border border-dark-600/50 text-dark-200 hover:bg-dark-700 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-colors"
        >
          保存
        </button>
      </div>
    </form>
  );
}

function AlertRulesPanel() {
  const { alertRules, toggleAlertRule, addAlertRule, updateAlertRule, deleteAlertRule } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteAlertRule(id);
  };

  const handleSave = (rule: AlertRule) => {
    const exists = alertRules.find((r) => r.id === rule.id);
    if (exists) {
      updateAlertRule(rule);
    } else {
      addAlertRule(rule);
    }
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const rules = alertRules;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">告警规则</h2>
          <p className="text-dark-400 text-sm mt-0.5">配置告警触发条件和阈值</p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建规则
        </button>
      </div>

      <GradientCard>
        <div className="p-1">
          <div className="rounded-lg border border-dark-600/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">规则名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">指标</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">条件</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">阈值</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">级别</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/30">
                {rules.map((rule) => {
                  const levelInfo = levelConfig[rule.level];
                  return (
                    <tr key={rule.id} className="hover:bg-dark-700/20 transition-colors">
                      <td className="px-4 py-3 text-white text-sm font-medium">{rule.name}</td>
                      <td className="px-4 py-3 text-dark-300 text-sm">{metricLabels[rule.metric] || rule.metric}</td>
                      <td className="px-4 py-3 text-dark-300 text-sm">{conditionLabels[rule.condition]}</td>
                      <td className="px-4 py-3 text-primary-400 text-sm font-mono">{rule.threshold}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
                          levelInfo.bgColor,
                          levelInfo.borderColor,
                          levelInfo.color
                        )}>
                          {levelInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <ToggleSwitch
                            enabled={rule.enabled}
                            onChange={() => toggleAlertRule(rule.id)}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(rule)}
                            className="p-1.5 rounded-md text-primary-400 hover:bg-primary-500/10 transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rule.id)}
                            className="p-1.5 rounded-md text-danger-400 hover:bg-danger-500/10 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </GradientCard>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRule(null); }}
        title={editingRule ? '编辑告警规则' : '新建告警规则'}
      >
        <AlertRuleForm
          rule={editingRule}
          onSave={handleSave}
          onCancel={() => { setIsModalOpen(false); setEditingRule(null); }}
        />
      </Modal>
    </div>
  );
}

function SilenceRulesPanel() {
  const { silenceRules, alertRules, toggleSilenceRule, addSilenceRule, updateSilenceRule, deleteSilenceRule } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SilenceRule | null>(null);

  const handleEdit = (rule: SilenceRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteSilenceRule(id);
  };

  const handleSave = (rule: SilenceRule) => {
    const exists = silenceRules.find((r) => r.id === rule.id);
    if (exists) {
      updateSilenceRule(rule);
    } else {
      addSilenceRule(rule);
    }
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const rules = silenceRules;

  const getAlertRuleNames = (ids: string[]) => {
    return ids
      .map((id) => alertRules.find((r) => r.id === id)?.name)
      .filter(Boolean)
      .join('、');
  };

  const getWeekDaysLabel = (days: number[]) => {
    if (days.length === 7) return '每天';
    if (days.length === 0) return '未设置';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return '周末';
    if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return '工作日';
    return days.map((d) => weekDays[d]).join('、');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">静默时段</h2>
          <p className="text-dark-400 text-sm mt-0.5">配置告警静默规则，减少干扰</p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建静默规则
        </button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <GradientCard key={rule.id}>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-medium">{rule.name}</h3>
                    {rule.enabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-success-500/10 text-success-500 border border-success-500/30">
                        <CheckCircle className="w-3 h-3" />
                        已启用
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-dark-700/50 text-dark-400 border border-dark-600/50">
                        <XCircle className="w-3 h-3" />
                        已禁用
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-dark-500 text-xs mb-1">时间段</p>
                      <div className="flex items-center gap-1 text-dark-200 text-sm">
                        <Clock className="w-3.5 h-3.5 text-primary-500" />
                        {rule.startTime} - {rule.endTime}
                      </div>
                    </div>
                    <div>
                      <p className="text-dark-500 text-xs mb-1">适用星期</p>
                      <p className="text-dark-200 text-sm">{getWeekDaysLabel(rule.daysOfWeek)}</p>
                    </div>
                    <div>
                      <p className="text-dark-500 text-xs mb-1">适用规则</p>
                      <p className="text-dark-200 text-sm truncate" title={getAlertRuleNames(rule.alertRuleIds)}>
                        {rule.alertRuleIds.length} 条规则
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <ToggleSwitch
                    enabled={rule.enabled}
                    onChange={() => toggleSilenceRule(rule.id)}
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(rule)}
                      className="p-1.5 rounded-md text-primary-400 hover:bg-primary-500/10 transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rule.id)}
                      className="p-1.5 rounded-md text-danger-400 hover:bg-danger-500/10 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </GradientCard>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRule(null); }}
        title={editingRule ? '编辑静默规则' : '新建静默规则'}
      >
        <SilenceRuleForm
          rule={editingRule}
          alertRules={alertRules}
          onSave={handleSave}
          onCancel={() => { setIsModalOpen(false); setEditingRule(null); }}
        />
      </Modal>
    </div>
  );
}

function EscalationRulesPanel() {
  const { escalationRules, toggleEscalationRule, addEscalationRule, updateEscalationRule, deleteEscalationRule } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);

  const handleEdit = (rule: EscalationRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteEscalationRule(id);
  };

  const handleSave = (rule: EscalationRule) => {
    const exists = escalationRules.find((r) => r.id === rule.id);
    if (exists) {
      updateEscalationRule(rule);
    } else {
      addEscalationRule(rule);
    }
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const rules = escalationRules;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">升级通知</h2>
          <p className="text-dark-400 text-sm mt-0.5">配置告警升级策略和通知方式</p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建升级规则
        </button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => {
          const levelInfo = levelConfig[rule.alertLevel];
          const ChannelIcon = channelIcons[rule.channel];
          return (
            <GradientCard key={rule.id}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-medium">{rule.name}</h3>
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                        levelInfo.bgColor,
                        levelInfo.borderColor,
                        levelInfo.color
                      )}>
                        {levelInfo.label}
                      </span>
                      {rule.enabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-success-500/10 text-success-500 border border-success-500/30">
                          <CheckCircle className="w-3 h-3" />
                          已启用
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-dark-700/50 text-dark-400 border border-dark-600/50">
                          <XCircle className="w-3 h-3" />
                          已禁用
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-dark-500 text-xs mb-1">等待时间</p>
                        <div className="flex items-center gap-1 text-dark-200 text-sm">
                          <Clock className="w-3.5 h-3.5 text-warning-500" />
                          {rule.waitTime} 分钟
                        </div>
                      </div>
                      <div>
                        <p className="text-dark-500 text-xs mb-1">通知方式</p>
                        <div className="flex items-center gap-1 text-dark-200 text-sm">
                          <ChannelIcon className="w-3.5 h-3.5 text-primary-500" />
                          {channelLabels[rule.channel]}
                        </div>
                      </div>
                      <div>
                        <p className="text-dark-500 text-xs mb-1">通知人</p>
                        <p className="text-dark-200 text-sm truncate" title={rule.notifyTo.join('、')}>
                          {rule.notifyTo.length} 人
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <ToggleSwitch
                      enabled={rule.enabled}
                      onChange={() => toggleEscalationRule(rule.id)}
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(rule)}
                        className="p-1.5 rounded-md text-primary-400 hover:bg-primary-500/10 transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 rounded-md text-danger-400 hover:bg-danger-500/10 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </GradientCard>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRule(null); }}
        title={editingRule ? '编辑升级规则' : '新建升级规则'}
      >
        <EscalationRuleForm
          rule={editingRule}
          onSave={handleSave}
          onCancel={() => { setIsModalOpen(false); setEditingRule(null); }}
        />
      </Modal>
    </div>
  );
}

function FavoritesPanel() {
  const { services, toggleFavorite, favoriteServices } = useAppStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const displayServices = favoriteServices;

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFavorites = [...displayServices];
    const [draggedItem] = newFavorites.splice(draggedIndex, 1);
    newFavorites.splice(index, 0, draggedItem);
    setFavorites(newFavorites);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const statusConfig = {
    healthy: { label: '正常', color: 'text-success-500', bgColor: 'bg-success-500/10', dotColor: 'bg-success-500' },
    warning: { label: '警告', color: 'text-warning-500', bgColor: 'bg-warning-500/10', dotColor: 'bg-warning-500' },
    critical: { label: '严重', color: 'text-danger-500', bgColor: 'bg-danger-500/10', dotColor: 'bg-danger-500' },
    offline: { label: '离线', color: 'text-dark-400', bgColor: 'bg-dark-700/50', dotColor: 'bg-dark-500' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">收藏管理</h2>
          <p className="text-dark-400 text-sm mt-0.5">管理已收藏的服务，可拖拽调整顺序</p>
        </div>
        <div className="text-dark-400 text-sm">
          共 <span className="text-primary-400 font-medium">{displayServices.length}</span> 个收藏
        </div>
      </div>

      {displayServices.length === 0 ? (
        <GradientCard>
          <div className="p-12 text-center">
            <Star className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">暂无收藏的服务</p>
            <p className="text-dark-500 text-sm mt-1">在服务列表中点击星标可添加收藏</p>
          </div>
        </GradientCard>
      ) : (
        <GradientCard>
          <div className="p-1">
            <div className="rounded-lg border border-dark-600/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-dark-700/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider w-10"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">服务名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">所属系统</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600/30">
                  {displayServices.map((service, index) => {
                    const status = statusConfig[service.status];
                    return (
                      <tr
                        key={service.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'hover:bg-dark-700/20 transition-colors cursor-move',
                          draggedIndex === index && 'opacity-50 bg-dark-700/30'
                        )}
                      >
                        <td className="px-4 py-3">
                          <GripVertical className="w-4 h-4 text-dark-600" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                            <span className="text-white text-sm font-medium">{service.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-dark-300 text-sm">{service.system}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={cn('w-2 h-2 rounded-full', status.dotColor)} />
                            <span className={cn('text-sm', status.color)}>{status.label}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleFavorite(service.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-warning-500 hover:bg-warning-500/10 transition-colors border border-warning-500/30"
                          >
                            <Star className="w-3.5 h-3.5 fill-warning-500" />
                            取消收藏
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </GradientCard>
      )}
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>('alert');

  const renderPanel = () => {
    switch (activeTab) {
      case 'alert':
        return <AlertRulesPanel />;
      case 'silence':
        return <SilenceRulesPanel />;
      case 'escalation':
        return <EscalationRulesPanel />;
      case 'favorite':
        return <FavoritesPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-6">
      <div className="w-52 flex-shrink-0">
        <GradientCard className="sticky top-6">
          <div className="p-3">
            <div className="px-3 py-2 mb-2">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary-500" />
                规则设置
              </h2>
            </div>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'text-dark-300 hover:bg-dark-700/50 hover:text-white border border-transparent'
                    )}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </GradientCard>
      </div>

      <div className="flex-1 min-w-0">
        {renderPanel()}
      </div>
    </div>
  );
}
