import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Filter,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  MessageSquare,
  Bell,
  Activity,
  Timer,
  Send,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { cn } from '../../lib/utils';
import { formatDateTime, formatRelativeTime } from '../../utils/format';
import type { Alert, AlertLevel, AlertStatus } from '../../types';

const levelConfig = {
  critical: {
    label: '严重',
    color: 'text-danger-500',
    bgColor: 'bg-danger-500/10',
    borderColor: 'border-danger-500/30',
    icon: AlertTriangle,
  },
  warning: {
    label: '警告',
    color: 'text-warning-500',
    bgColor: 'bg-warning-500/10',
    borderColor: 'border-warning-500/30',
    icon: AlertCircle,
  },
  info: {
    label: '信息',
    color: 'text-primary-500',
    bgColor: 'bg-primary-500/10',
    borderColor: 'border-primary-500/30',
    icon: Info,
  },
};

const statusConfig = {
  pending: {
    label: '待处理',
    color: 'text-danger-500',
    bgColor: 'bg-danger-500/10',
    borderColor: 'border-danger-500/30',
  },
  acknowledged: {
    label: '已确认',
    color: 'text-warning-500',
    bgColor: 'bg-warning-500/10',
    borderColor: 'border-warning-500/30',
  },
  closed: {
    label: '已关闭',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
  },
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
}

function StatsCard({ title, value, icon: Icon, iconColor, trend, trendUp }: StatsCardProps) {
  return (
    <div className="relative p-5 rounded-xl bg-dark-800/50 backdrop-blur-sm overflow-hidden group">
      <div className="absolute inset-0 rounded-xl p-[1px] pointer-events-none">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500/20 via-transparent to-primary-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-dark-400 text-sm mb-2">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          <div className={cn('p-3 rounded-lg bg-dark-700/50', iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className={trendUp ? 'text-danger-500' : 'text-success-500'}>
              {trendUp ? '↑' : '↓'}
            </span>
            <span className="text-dark-400">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-sm text-dark-200 hover:border-primary-500/50 transition-colors min-w-[100px]"
      >
        <span className="text-dark-400">{label}:</span>
        <span className="text-white">{selectedLabel}</span>
        <ChevronDown className="w-4 h-4 text-dark-400 ml-auto" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 py-1 rounded-lg bg-dark-800 border border-dark-600/50 shadow-card-dark min-w-[120px] animate-fade-in">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-dark-700/50 transition-colors',
                  value === option.value ? 'text-primary-500 bg-primary-500/10' : 'text-dark-200'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface AlertDetailDrawerProps {
  alert: Alert | null;
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
  onCloseAlert: (alertId: string) => void;
  onAddNote: (alertId: string, content: string) => void;
}

function AlertDetailDrawer({ alert, onClose, onAcknowledge, onCloseAlert, onAddNote }: AlertDetailDrawerProps) {
  const [noteContent, setNoteContent] = useState('');

  if (!alert) return null;

  const levelInfo = levelConfig[alert.level];
  const statusInfo = statusConfig[alert.status];
  const LevelIcon = levelInfo.icon;

  const handleAddNote = () => {
    if (noteContent.trim()) {
      onAddNote(alert.id, noteContent.trim());
      setNoteContent('');
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-dark-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-dark-800 border-l border-dark-600/50 shadow-2xl animate-slide-in overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-dark-600/50">
          <h3 className="text-lg font-semibold text-white">告警详情</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
            <div className="flex items-start gap-3 mb-4">
              <div className={cn('p-2.5 rounded-lg', levelInfo.bgColor, levelInfo.borderColor, 'border')}>
                <LevelIcon className={cn('w-5 h-5', levelInfo.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium mb-1">{alert.ruleName}</h4>
                <p className="text-dark-400 text-sm truncate">{alert.serviceName}</p>
              </div>
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border',
                statusInfo.bgColor,
                statusInfo.borderColor,
                statusInfo.color
              )}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-dark-300 text-sm leading-relaxed">{alert.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-dark-700/30 border border-dark-600/30">
              <p className="text-dark-400 text-xs mb-1">重复次数</p>
              <p className="text-white font-medium">{alert.count} 次</p>
            </div>
            <div className="p-3 rounded-lg bg-dark-700/30 border border-dark-600/30">
              <p className="text-dark-400 text-xs mb-1">告警级别</p>
              <p className={cn('font-medium', levelInfo.color)}>{levelInfo.label}</p>
            </div>
            <div className="p-3 rounded-lg bg-dark-700/30 border border-dark-600/30">
              <p className="text-dark-400 text-xs mb-1">首次触发</p>
              <p className="text-white text-sm">{formatDateTime(alert.firstTriggered)}</p>
              <p className="text-dark-500 text-xs">{formatRelativeTime(alert.firstTriggered)}</p>
            </div>
            <div className="p-3 rounded-lg bg-dark-700/30 border border-dark-600/30">
              <p className="text-dark-400 text-xs mb-1">最近触发</p>
              <p className="text-white text-sm">{formatDateTime(alert.lastTriggered)}</p>
              <p className="text-dark-500 text-xs">{formatRelativeTime(alert.lastTriggered)}</p>
            </div>
          </div>

          {alert.acknowledgedBy && (
            <div className="p-3 rounded-lg bg-dark-700/30 border border-dark-600/30">
              <p className="text-dark-400 text-xs mb-1">确认信息</p>
              <p className="text-white text-sm">
                由 <span className="text-primary-500">{alert.acknowledgedBy}</span> 于 {formatDateTime(alert.acknowledgedAt!)} 确认
              </p>
            </div>
          )}

          {alert.closedBy && (
            <div className="p-3 rounded-lg bg-dark-700/30 border border-dark-600/30">
              <p className="text-dark-400 text-xs mb-1">关闭信息</p>
              <p className="text-white text-sm">
                由 <span className="text-success-500">{alert.closedBy}</span> 于 {formatDateTime(alert.closedAt!)} 关闭
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-primary-500" />
              <h4 className="text-white font-medium">处置备注</h4>
              <span className="text-dark-500 text-sm">({alert.notes.length})</span>
            </div>
            <div className="space-y-3">
              {alert.notes.length === 0 ? (
                <div className="p-4 rounded-lg bg-dark-700/20 border border-dashed border-dark-600/30 text-center">
                  <p className="text-dark-500 text-sm">暂无备注</p>
                </div>
              ) : (
                alert.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-dark-700/30 border border-dark-600/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-primary-500 text-sm font-medium">{note.author}</span>
                      <span className="text-dark-500 text-xs">{formatRelativeTime(note.createdAt)}</span>
                    </div>
                    <p className="text-dark-200 text-sm">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-dark-600/50 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="添加备注..."
              className="flex-1 px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50"
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            />
            <button
              type="button"
              onClick={handleAddNote}
              disabled={!noteContent.trim()}
              className="px-3 py-2 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-500 hover:bg-primary-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            {alert.status === 'pending' && (
              <button
                type="button"
                onClick={() => onAcknowledge(alert.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-warning-500/20 border border-warning-500/30 text-warning-500 hover:bg-warning-500/30 transition-colors"
              >
                <Check className="w-4 h-4" />
                确认告警
              </button>
            )}
            {alert.status !== 'closed' && (
              <button
                type="button"
                onClick={() => onCloseAlert(alert.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-success-500/20 border border-success-500/30 text-success-500 hover:bg-success-500/30 transition-colors"
              >
                <X className="w-4 h-4" />
                关闭告警
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function Alerts() {
  const { alerts, services, acknowledgeAlert, closeAlert, addAlertNote, pendingAlerts, criticalAlerts } = useAppStore();

  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const pageSize = 10;

  const todayAlerts = useMemo(() => {
    const today = new Date();
    return alerts.filter((alert) => {
      const alertDate = new Date(alert.firstTriggered);
      return (
        alertDate.getFullYear() === today.getFullYear() &&
        alertDate.getMonth() === today.getMonth() &&
        alertDate.getDate() === today.getDate()
      );
    });
  }, [alerts]);

  const avgResponseTime = useMemo(() => {
    const acknowledged = alerts.filter((a) => a.acknowledgedAt && a.firstTriggered);
    if (acknowledged.length === 0) return '0分钟';
    const totalMs = acknowledged.reduce((sum, alert) => {
      const diff = new Date(alert.acknowledgedAt!).getTime() - new Date(alert.firstTriggered).getTime();
      return sum + diff;
    }, 0);
    const avgMs = totalMs / acknowledged.length;
    const minutes = Math.round(avgMs / 60000);
    return `${minutes}分钟`;
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (levelFilter !== 'all' && alert.level !== levelFilter) return false;
      if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
      if (serviceFilter !== 'all' && alert.serviceId !== serviceFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          alert.ruleName.toLowerCase().includes(query) ||
          alert.serviceName.toLowerCase().includes(query) ||
          alert.message.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [alerts, levelFilter, statusFilter, serviceFilter, searchQuery]);

  const totalPages = Math.ceil(filteredAlerts.length / pageSize);
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAlerts.slice(start, start + pageSize);
  }, [filteredAlerts, currentPage]);

  const chartOption = useMemo(() => {
    const hours: string[] = [];
    const criticalData: number[] = [];
    const warningData: number[] = [];
    const infoData: number[] = [];

    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      hours.push(`${hour.getHours()}:00`);

      let critical = 0;
      let warning = 0;
      let info = 0;

      alerts.forEach((alert) => {
        const alertTime = new Date(alert.lastTriggered);
        if (
          alertTime.getHours() === hour.getHours() &&
          alertTime.getDate() === hour.getDate() &&
          alertTime.getMonth() === hour.getMonth()
        ) {
          if (alert.level === 'critical') critical += alert.count;
          else if (alert.level === 'warning') warning += alert.count;
          else if (alert.level === 'info') info += alert.count;
        }
      });

      criticalData.push(critical);
      warningData.push(warning);
      infoData.push(info);
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10, 22, 40, 0.95)',
        borderColor: 'rgba(65, 110, 178, 0.3)',
        textStyle: { color: '#fff' },
        axisPointer: {
          type: 'shadow',
          shadowStyle: { color: 'rgba(0, 212, 255, 0.1)' },
        },
      },
      legend: {
        data: ['严重', '警告', '信息'],
        textStyle: { color: '#8da8d1' },
        top: 0,
        right: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: 'rgba(65, 110, 178, 0.3)' } },
        axisLabel: { color: '#8da8d1', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#8da8d1', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(65, 110, 178, 0.1)', type: 'dashed' } },
      },
      series: [
        {
          name: '严重',
          type: 'bar',
          stack: 'total',
          data: criticalData,
          itemStyle: {
            color: '#ff4d6d',
            borderRadius: [0, 0, 0, 0],
          },
          barWidth: '50%',
        },
        {
          name: '警告',
          type: 'bar',
          stack: 'total',
          data: warningData,
          itemStyle: {
            color: '#ff9f43',
          },
        },
        {
          name: '信息',
          type: 'bar',
          stack: 'total',
          data: infoData,
          itemStyle: {
            color: '#00d4ff',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [alerts]);

  const serviceOptions = useMemo(() => {
    return [
      { value: 'all', label: '全部服务' },
      ...services.map((s) => ({ value: s.id, label: s.name })),
    ];
  }, [services]);

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId, '当前用户');
    if (selectedAlert?.id === alertId) {
      const updated = alerts.find((a) => a.id === alertId);
      if (updated) setSelectedAlert(updated);
    }
  };

  const handleCloseAlert = (alertId: string) => {
    closeAlert(alertId, '当前用户');
    if (selectedAlert?.id === alertId) {
      const updated = alerts.find((a) => a.id === alertId);
      if (updated) setSelectedAlert(updated);
    }
  };

  const handleAddNote = (alertId: string, content: string) => {
    addAlertNote(alertId, content, '当前用户');
    if (selectedAlert?.id === alertId) {
      const updated = alerts.find((a) => a.id === alertId);
      if (updated) setSelectedAlert(updated);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">告警列表</h1>
          <p className="text-dark-400 text-sm mt-1">查看和管理所有告警信息</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="待处理告警"
          value={pendingAlerts.length}
          icon={Bell}
          iconColor="text-danger-500"
          trend="较昨日 +12%"
          trendUp
        />
        <StatsCard
          title="严重告警"
          value={criticalAlerts.length}
          icon={AlertTriangle}
          iconColor="text-danger-500"
          trend="较昨日 +3"
          trendUp
        />
        <StatsCard
          title="今日告警总数"
          value={todayAlerts.length}
          icon={Activity}
          iconColor="text-warning-500"
          trend="较昨日 -8%"
        />
        <StatsCard
          title="平均响应时间"
          value={avgResponseTime}
          icon={Timer}
          iconColor="text-primary-500"
          trend="较昨日 -15%"
        />
      </div>

      <div className="relative p-5 rounded-xl bg-dark-800/50 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 rounded-xl p-[1px] pointer-events-none">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500/20 via-transparent to-primary-500/5 opacity-50" />
        </div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-500" />
              告警频次趋势
            </h3>
            <span className="text-dark-500 text-sm">近24小时</span>
          </div>
          <div className="h-64">
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="relative p-5 rounded-xl bg-dark-800/50 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 rounded-xl p-[1px] pointer-events-none">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500/20 via-transparent to-primary-500/5 opacity-50" />
        </div>
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-dark-400" />
              <span className="text-dark-400 text-sm">筛选:</span>
            </div>
            <FilterSelect
              label="级别"
              value={levelFilter}
              options={[
                { value: 'all', label: '全部' },
                { value: 'critical', label: '严重' },
                { value: 'warning', label: '警告' },
                { value: 'info', label: '信息' },
              ]}
              onChange={(v) => {
                setLevelFilter(v as AlertLevel | 'all');
                setCurrentPage(1);
              }}
            />
            <FilterSelect
              label="状态"
              value={statusFilter}
              options={[
                { value: 'all', label: '全部' },
                { value: 'pending', label: '待处理' },
                { value: 'acknowledged', label: '已确认' },
                { value: 'closed', label: '已关闭' },
              ]}
              onChange={(v) => {
                setStatusFilter(v as AlertStatus | 'all');
                setCurrentPage(1);
              }}
            />
            <FilterSelect
              label="服务"
              value={serviceFilter}
              options={serviceOptions}
              onChange={(v) => {
                setServiceFilter(v);
                setCurrentPage(1);
              }}
            />
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="搜索告警..."
                className="pl-9 pr-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50 w-56"
              />
            </div>
          </div>

          <div className="rounded-lg border border-dark-600/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">级别</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">告警规则</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">服务</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">消息</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">重复次数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">首次触发</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">最近触发</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/30">
                {paginatedAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <p className="text-dark-500">暂无匹配的告警</p>
                    </td>
                  </tr>
                ) : (
                  paginatedAlerts.map((alert) => {
                    const levelInfo = levelConfig[alert.level];
                    const statusInfo = statusConfig[alert.status];
                    const LevelIcon = levelInfo.icon;
                    return (
                      <tr
                        key={alert.id}
                        className="hover:bg-dark-700/20 transition-colors cursor-pointer group"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border',
                            levelInfo.bgColor,
                            levelInfo.borderColor,
                            levelInfo.color
                          )}>
                            <LevelIcon className="w-3.5 h-3.5" />
                            {levelInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white text-sm font-medium">{alert.ruleName}</td>
                        <td className="px-4 py-3 text-dark-300 text-sm">{alert.serviceName}</td>
                        <td className="px-4 py-3 text-dark-400 text-sm max-w-xs truncate">{alert.message}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-primary-500 font-medium">{alert.count}</span>
                        </td>
                        <td className="px-4 py-3 text-dark-400 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-dark-500" />
                            {formatRelativeTime(alert.firstTriggered)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-dark-400 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-dark-500" />
                            {formatRelativeTime(alert.lastTriggered)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                            statusInfo.bgColor,
                            statusInfo.borderColor,
                            statusInfo.color
                          )}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {alert.status === 'pending' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcknowledge(alert.id);
                                }}
                                className="p-1.5 rounded-md text-warning-500 hover:bg-warning-500/10 transition-colors"
                                title="确认"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {alert.status !== 'closed' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCloseAlert(alert.id);
                                }}
                                className="p-1.5 rounded-md text-success-500 hover:bg-success-500/10 transition-colors"
                                title="关闭"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAlert(alert);
                              }}
                              className="p-1.5 rounded-md text-primary-500 hover:bg-primary-500/10 transition-colors"
                              title="备注"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-dark-500 text-sm">
                共 {filteredAlerts.length} 条告警，第 {currentPage} / {totalPages} 页
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-dark-600/50 text-dark-400 hover:text-white hover:border-primary-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'min-w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                        currentPage === pageNum
                          ? 'bg-primary-500/20 text-primary-500 border border-primary-500/30'
                          : 'text-dark-400 hover:text-white hover:bg-dark-700/50 border border-transparent'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-dark-600/50 text-dark-400 hover:text-white hover:border-primary-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDetailDrawer
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onAcknowledge={handleAcknowledge}
        onCloseAlert={handleCloseAlert}
        onAddNote={handleAddNote}
      />
    </div>
  );
}
