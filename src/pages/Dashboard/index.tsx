import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import {
  Activity,
  Server,
  Bell,
  AlertOctagon,
  Star,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { formatPercent, formatRelativeTime } from '@/utils/format';
import type { ServiceStatus, AlertLevel, AlertStatus } from '@/types';

const statusTextColors: Record<ServiceStatus, string> = {
  healthy: 'text-success-500',
  warning: 'text-warning-500',
  critical: 'text-danger-500',
  offline: 'text-dark-400',
};

const levelColors: Record<AlertLevel, string> = {
  critical: '#ff4d6d',
  warning: '#ff9f43',
  info: '#00d4ff',
};

const levelLabels: Record<AlertLevel, string> = {
  critical: '严重',
  warning: '警告',
  info: '信息',
};

const statusLabels: Record<AlertStatus, string> = {
  pending: '待处理',
  acknowledged: '已确认',
  closed: '已关闭',
};

const StatusIcon = ({ status }: { status: AlertStatus }) => {
  switch (status) {
    case 'pending':
      return <AlertCircle className="h-3.5 w-3.5 text-danger-400" />;
    case 'acknowledged':
      return <CheckCircle className="h-3.5 w-3.5 text-warning-400" />;
    case 'closed':
      return <XCircle className="h-3.5 w-3.5 text-dark-400" />;
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { services, alerts, incidents, favoriteServices, toggleFavorite } = useAppStore();

  const stats = useMemo(() => {
    const healthyCount = services.filter((s) => s.status === 'healthy').length;
    const warningCount = services.filter((s) => s.status === 'warning').length;
    const criticalCount = services.filter((s) => s.status === 'critical').length;

    const today = new Date();
    const todayAlerts = alerts.filter(
      (a) => new Date(a.lastTriggered).toDateString() === today.toDateString()
    );
    const criticalAlerts = todayAlerts.filter((a) => a.level === 'critical').length;
    const warningAlerts = todayAlerts.filter((a) => a.level === 'warning').length;
    const infoAlerts = todayAlerts.filter((a) => a.level === 'info').length;

    const ongoingIncidents = incidents.filter((i) => i.status === 'ongoing');
    const overallAvailability =
      services.reduce((sum, s) => sum + s.availability, 0) / services.length;

    return {
      overallAvailability: overallAvailability.toFixed(2),
      availabilityTrend: -0.03,
      totalServices: services.length,
      healthyCount,
      warningCount,
      criticalCount,
      todayAlertsCount: todayAlerts.length,
      criticalAlerts,
      warningAlerts,
      infoAlerts,
      ongoingIncidents: ongoingIncidents.length,
      ongoingSeverity: ongoingIncidents[0]?.severity || 'critical',
    };
  }, [services, alerts, incidents]);

  const availabilityTrendData = useMemo(() => {
    const days = 30;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const dates: string[] = [];
    const values: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * dayMs);
      dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
      const baseValue = 99.85 + Math.sin(i * 0.3) * 0.08;
      const noise = (Math.random() - 0.5) * 0.06;
      values.push(Math.min(99.99, Math.max(99.5, baseValue + noise)));
    }

    return { dates, values };
  }, []);

  const lineChartOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 27, 49, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderWidth: 1,
        textStyle: {
          color: '#e0e7ff',
          fontSize: 12,
        },
        formatter: (params: Array<{ axisValue: string; value: number }>) => {
          const data = params[0];
          return `<div style="padding: 4px 8px;">
            <div style="margin-bottom: 4px; color: #8da8d1;">${data.axisValue}</div>
            <div style="font-size: 16px; font-weight: 600; color: #00d4ff;">${data.value.toFixed(2)}%</div>
          </div>`;
        },
      },
      xAxis: {
        type: 'category',
        data: availabilityTrendData.dates,
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 212, 255, 0.15)',
          },
        },
        axisLabel: {
          color: '#678bc1',
          fontSize: 11,
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        min: 99.5,
        max: 100,
        axisLine: {
          show: false,
        },
        axisLabel: {
          color: '#678bc1',
          fontSize: 11,
          formatter: '{value}%',
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0, 212, 255, 0.08)',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: '可用率',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#00d4ff',
            width: 2,
            shadowColor: 'rgba(0, 212, 255, 0.5)',
            shadowBlur: 10,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 212, 255, 0.35)' },
                { offset: 0.5, color: 'rgba(0, 212, 255, 0.15)' },
                { offset: 1, color: 'rgba(0, 212, 255, 0.02)' },
              ],
            },
          },
          data: availabilityTrendData.values,
          markLine: {
            symbol: 'none',
            lineStyle: {
              color: '#ff4d6d',
              type: 'dashed',
              width: 1.5,
            },
            label: {
              formatter: 'SLA 99.9%',
              color: '#ff4d6d',
              fontSize: 11,
              backgroundColor: 'rgba(255, 77, 109, 0.1)',
              padding: [2, 6],
              borderRadius: 3,
            },
            data: [
              {
                yAxis: 99.9,
              },
            ],
          },
        },
      ],
    }),
    [availabilityTrendData]
  );

  const alertDistribution = useMemo(() => {
    const critical = alerts.filter((a) => a.level === 'critical').length;
    const warning = alerts.filter((a) => a.level === 'warning').length;
    const info = alerts.filter((a) => a.level === 'info').length;
    const total = critical + warning + info;

    return {
      total,
      data: [
        { value: critical, name: '严重', itemStyle: { color: levelColors.critical } },
        { value: warning, name: '警告', itemStyle: { color: levelColors.warning } },
        { value: info, name: '信息', itemStyle: { color: levelColors.info } },
      ],
    };
  }, [alerts]);

  const pieChartOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 27, 49, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderWidth: 1,
        textStyle: {
          color: '#e0e7ff',
          fontSize: 12,
        },
        formatter: (params: { name: string; value: number; percent: number; color?: string }) => {
          return `<div style="padding: 4px 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${params.color || '#00d4ff'};"></div>
              <span style="color: #8da8d1;">${params.name}</span>
            </div>
            <div style="margin-top: 4px; font-size: 16px; font-weight: 600; color: #e0e7ff;">${params.value} <span style="font-size: 12px; color: #678bc1;">(${params.percent}%)</span></div>
          </div>`;
        },
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 16,
        textStyle: {
          color: '#8da8d1',
          fontSize: 12,
        },
        formatter: (name: string) => {
          const item = alertDistribution.data.find((d) => d.name === name);
          return `${name}  ${item?.value || 0}`;
        },
      },
      series: [
        {
          name: '告警分布',
          type: 'pie',
          radius: ['55%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#0a1628',
            borderWidth: 2,
          },
          label: {
            show: true,
            position: 'center',
            formatter: () => {
              return `{total|${alertDistribution.total}}\n{label|告警总数}`;
            },
            rich: {
              total: {
                fontSize: 28,
                fontWeight: 'bold',
                color: '#e0e7ff',
                lineHeight: 36,
              },
              label: {
                fontSize: 12,
                color: '#678bc1',
                lineHeight: 18,
              },
            },
          },
          emphasis: {
            scale: true,
            scaleSize: 6,
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0, 212, 255, 0.3)',
            },
          },
          labelLine: {
            show: false,
          },
          data: alertDistribution.data,
        },
      ],
    }),
    [alertDistribution]
  );

  const latestAlerts = useMemo(() => {
    return [...alerts]
      .sort((a, b) => new Date(b.lastTriggered).getTime() - new Date(a.lastTriggered).getTime())
      .slice(0, 5);
  }, [alerts]);

  const handleServiceClick = (serviceId: string) => {
    navigate(`/topology?service=${serviceId}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="gradient-border p-5 stagger-item"
          style={{ animationDelay: '0ms' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-dark-300">整体可用率</p>
              <p className="mt-2 text-3xl font-bold text-white text-glow">
                {stats.overallAvailability}%
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20">
              <Activity className="h-5 w-5 text-primary-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1">
            {stats.availabilityTrend >= 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-success-500" />
                <span className="text-sm text-success-500">
                  +{Math.abs(stats.availabilityTrend)}%
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-danger-400" />
                <span className="text-sm text-danger-400">
                  -{Math.abs(stats.availabilityTrend)}%
                </span>
              </>
            )}
            <span className="text-xs text-dark-400">较昨日</span>
          </div>
        </div>

        <div
          className="gradient-border p-5 stagger-item"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-dark-300">服务总数</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.totalServices}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-500/20">
              <Server className="h-5 w-5 text-success-500" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success-500" />
              <span className="text-dark-200">健康 {stats.healthyCount}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-warning-500" />
              <span className="text-dark-200">警告 {stats.warningCount}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-danger-500" />
              <span className="text-dark-200">严重 {stats.criticalCount}</span>
            </span>
          </div>
        </div>

        <div
          className="gradient-border p-5 stagger-item"
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-dark-300">今日告警数</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.todayAlertsCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-500/20">
              <Bell className="h-5 w-5 text-warning-500" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-danger-500" />
              <span className="text-dark-200">严重 {stats.criticalAlerts}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-warning-500" />
              <span className="text-dark-200">警告 {stats.warningAlerts}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary-400" />
              <span className="text-dark-200">信息 {stats.infoAlerts}</span>
            </span>
          </div>
        </div>

        <div
          className="gradient-border p-5 stagger-item"
          style={{ animationDelay: '300ms' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-dark-300">进行中事故</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.ongoingIncidents}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-500/20">
              <AlertOctagon className="h-5 w-5 text-danger-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-500/20 px-2.5 py-1 text-xs font-medium text-danger-400 ring-1 ring-inset ring-danger-500/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger-500" />
              </span>
              {stats.ongoingSeverity === 'critical' ? '严重级别' : '主要级别'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div
          className="gradient-border p-5 lg:col-span-2 stagger-item"
          style={{ animationDelay: '400ms' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">可用率趋势</h3>
            <span className="text-xs text-dark-400">近30天</span>
          </div>
          <ReactECharts
            option={lineChartOption}
            style={{ height: 280, width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>

        <div
          className="gradient-border p-5 stagger-item"
          style={{ animationDelay: '500ms' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">告警分布</h3>
          </div>
          <ReactECharts
            option={pieChartOption}
            style={{ height: 280, width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          className="gradient-border p-5 stagger-item"
          style={{ animationDelay: '600ms' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">重点服务</h3>
            <button
              onClick={() => navigate('/topology')}
              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              查看全部
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {favoriteServices.length === 0 ? (
              <div className="py-8 text-center text-sm text-dark-400">
                暂无收藏的服务
              </div>
            ) : (
              favoriteServices.map((service, index) => (
                <div
                  key={service.id}
                  className="group flex items-center justify-between rounded-lg border border-transparent bg-dark-800/30 px-4 py-3 transition-all hover:border-primary-500/20 hover:bg-dark-800/50 cursor-pointer"
                  style={{ animationDelay: `${700 + index * 50}ms` }}
                  onClick={() => handleServiceClick(service.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`status-dot ${service.status}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{service.name}</p>
                      <p className="text-xs text-dark-400">{service.system}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${statusTextColors[service.status]}`}>
                        {formatPercent(service.availability)}
                      </p>
                      <p className="text-xs text-dark-400">{service.avgResponseTime}ms</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(service.id);
                      }}
                      className="opacity-100 transition-opacity group-hover:opacity-100"
                    >
                      <Star className="h-4 w-4 fill-warning-500 text-warning-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          className="gradient-border p-5 stagger-item"
          style={{ animationDelay: '700ms' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">最新告警</h3>
            <button
              onClick={() => navigate('/alerts')}
              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              查看全部
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {latestAlerts.map((alert, index) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-lg bg-dark-800/30 px-4 py-3 transition-colors hover:bg-dark-800/50 cursor-pointer"
                style={{ animationDelay: `${800 + index * 50}ms` }}
                onClick={() => navigate('/alerts')}
              >
                <div className="mt-0.5">
                  <span
                    className={`tag ${
                      alert.level === 'critical'
                        ? 'tag-critical'
                        : alert.level === 'warning'
                        ? 'tag-warning'
                        : 'tag-info'
                    }`}
                  >
                    {levelLabels[alert.level]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {alert.serviceName}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-dark-300 truncate">{alert.message}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-dark-400">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(alert.lastTriggered)}
                    </span>
                    <span className="flex items-center gap-1 text-dark-400">
                      <StatusIcon status={alert.status} />
                      {statusLabels[alert.status]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
