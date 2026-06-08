import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Search,
  X,
  ChevronDown,
  Activity,
  AlertTriangle,
  Zap,
  ShieldCheck,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { metricsData } from '@/data/metrics';
import { formatPercent, formatNumber } from '@/utils/format';
import type { MetricType, Service, MetricDataPoint } from '@/types';

const metricTabs: { key: MetricType; label: string; icon: typeof Activity; unit: string }[] = [
  { key: 'responseTime', label: '响应时间', icon: Clock, unit: 'ms' },
  { key: 'errorRate', label: '错误率', icon: AlertTriangle, unit: '%' },
  { key: 'qps', label: 'QPS', icon: Zap, unit: '' },
  { key: 'availability', label: '可用率', icon: ShieldCheck, unit: '%' },
];

const timeRanges = [
  { key: '1h', label: '1小时', hours: 1 },
  { key: '6h', label: '6小时', hours: 6 },
  { key: '24h', label: '24小时', hours: 24 },
  { key: '7d', label: '7天', hours: 168 },
  { key: '30d', label: '30天', hours: 720 },
];

const lineColors = [
  '#00d4ff',
  '#ff9f43',
  '#2ed573',
  '#ff6b81',
  '#a55eea',
];

const gradientStops = [
  [
    { offset: 0, color: 'rgba(0, 212, 255, 0.4)' },
    { offset: 0.5, color: 'rgba(0, 212, 255, 0.15)' },
    { offset: 1, color: 'rgba(0, 212, 255, 0.02)' },
  ],
  [
    { offset: 0, color: 'rgba(255, 159, 67, 0.4)' },
    { offset: 0.5, color: 'rgba(255, 159, 67, 0.15)' },
    { offset: 1, color: 'rgba(255, 159, 67, 0.02)' },
  ],
  [
    { offset: 0, color: 'rgba(46, 213, 115, 0.4)' },
    { offset: 0.5, color: 'rgba(46, 213, 115, 0.15)' },
    { offset: 1, color: 'rgba(46, 213, 115, 0.02)' },
  ],
  [
    { offset: 0, color: 'rgba(255, 107, 129, 0.4)' },
    { offset: 0.5, color: 'rgba(255, 107, 129, 0.15)' },
    { offset: 1, color: 'rgba(255, 107, 129, 0.02)' },
  ],
  [
    { offset: 0, color: 'rgba(165, 94, 234, 0.4)' },
    { offset: 0.5, color: 'rgba(165, 94, 234, 0.15)' },
    { offset: 1, color: 'rgba(165, 94, 234, 0.02)' },
  ],
];

export default function Metrics() {
  const { services, getServiceById } = useAppStore();
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('responseTime');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [selectedServices, setSelectedServices] = useState<string[]>(['svc-001', 'svc-002', 'svc-004']);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const timeRangeHours = useMemo(() => {
    const range = timeRanges.find((r) => r.key === timeRange);
    return range ? range.hours : 24;
  }, [timeRange]);

  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    return services.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.system.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, searchQuery]);

  const getMetricDataForService = (serviceId: string, metric: MetricType): MetricDataPoint[] => {
    const metricData = metricsData.find(
      (m) => m.serviceId === serviceId && m.metric === metric
    );
    if (!metricData) return [];

    const now = Date.now();
    const cutoffTime = now - timeRangeHours * 60 * 60 * 1000;
    return metricData.data.filter((d) => d.timestamp >= cutoffTime);
  };

  const chartData = useMemo(() => {
    return selectedServices.map((serviceId, index) => {
      const service = getServiceById(serviceId);
      const data = getMetricDataForService(serviceId, selectedMetric);
      return {
        serviceId,
        serviceName: service?.name || serviceId,
        color: lineColors[index % lineColors.length],
        gradient: gradientStops[index % gradientStops.length],
        data,
      };
    });
  }, [selectedServices, selectedMetric, timeRangeHours, getServiceById]);

  const stats = useMemo(() => {
    const results = selectedServices.map((serviceId) => {
      const data = getMetricDataForService(serviceId, selectedMetric);
      if (data.length === 0) {
        return {
          serviceId,
          current: 0,
          average: 0,
          peak: 0,
          valley: 0,
          trend: 0,
        };
      }

      const values = data.map((d) => d.value);
      const current = values[values.length - 1];
      const average = values.reduce((sum, v) => sum + v, 0) / values.length;
      const peak = Math.max(...values);
      const valley = Math.min(...values);

      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
      const trend = firstAvg === 0 ? 0 : ((secondAvg - firstAvg) / firstAvg) * 100;

      return {
        serviceId,
        current,
        average,
        peak,
        valley,
        trend,
      };
    });
    return results;
  }, [selectedServices, selectedMetric, timeRangeHours]);

  const rankedServices = useMemo(() => {
    return services
      .map((service) => {
        const data = getMetricDataForService(service.id, selectedMetric);
        const current = data.length > 0 ? data[data.length - 1].value : 0;

        const values = data.map((d) => d.value);
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length : 0;
        const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length : 0;
        const trend = firstAvg === 0 ? 0 : ((secondAvg - firstAvg) / firstAvg) * 100;

        return {
          service,
          current,
          trend,
        };
      })
      .sort((a, b) => {
        if (selectedMetric === 'availability') {
          return b.current - a.current;
        }
        if (selectedMetric === 'errorRate' || selectedMetric === 'responseTime') {
          return a.current - b.current;
        }
        return b.current - a.current;
      });
  }, [services, selectedMetric, timeRangeHours]);

  const chartOption = useMemo(() => {
    const xAxisData = chartData[0]?.data.map((d) => {
      const date = new Date(d.timestamp);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }) || [];

    const series = chartData.map((item) => ({
      name: item.serviceName,
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: item.color,
        width: 2,
        shadowColor: item.color,
        shadowBlur: 8,
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: item.gradient,
        },
      },
      data: item.data.map((d) => d.value),
    }));

    const currentMetric = metricTabs.find((t) => t.key === selectedMetric);
    const unit = currentMetric?.unit || '';

    return {
      backgroundColor: 'transparent',
      legend: {
        show: chartData.length > 1,
        top: 0,
        right: 0,
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
        textStyle: {
          color: '#8da8d1',
          fontSize: 12,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
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
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: 'rgba(0, 212, 255, 0.3)',
            type: 'dashed',
          },
        },
        formatter: (params: Array<{ seriesName: string; value: number; color?: string; axisValue: string }>) => {
          let html = `<div style="padding: 4px 8px;"><div style="margin-bottom: 8px; color: #8da8d1; font-size: 12px;">${params[0]?.axisValue || ''}</div>`;
          params.forEach((item) => {
            const displayValue = selectedMetric === 'availability' || selectedMetric === 'errorRate'
              ? `${item.value.toFixed(2)}%`
              : selectedMetric === 'qps'
              ? formatNumber(Math.round(item.value))
              : `${item.value.toFixed(0)}ms`;
            html += `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 4px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: ${item.color || '#00d4ff'};"></div>
                  <span style="color: #8da8d1;">${item.seriesName}</span>
                </div>
                <span style="font-weight: 600; color: #e0e7ff;">${displayValue}${unit}</span>
              </div>
            `;
          });
          html += '</div>';
          return html;
        },
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 24,
          bottom: 0,
          borderColor: 'transparent',
          backgroundColor: 'rgba(0, 212, 255, 0.05)',
          fillerColor: 'rgba(0, 212, 255, 0.15)',
          handleStyle: {
            color: '#00d4ff',
            borderColor: '#00d4ff',
          },
          textStyle: {
            color: '#678bc1',
            fontSize: 10,
          },
          dataBackground: {
            lineStyle: {
              color: 'rgba(0, 212, 255, 0.3)',
            },
            areaStyle: {
              color: 'rgba(0, 212, 255, 0.1)',
            },
          },
        },
      ],
      xAxis: {
        type: 'category',
        data: xAxisData,
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
        axisLine: {
          show: false,
        },
        axisLabel: {
          color: '#678bc1',
          fontSize: 11,
          formatter: (value: number) => {
            if (selectedMetric === 'availability' || selectedMetric === 'errorRate') {
              return `${value}%`;
            }
            if (selectedMetric === 'qps') {
              return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
            }
            return String(value);
          },
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0, 212, 255, 0.08)',
            type: 'dashed',
          },
        },
      },
      series,
    };
  }, [chartData, selectedMetric]);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, serviceId];
    });
  };

  const removeService = (serviceId: string) => {
    setSelectedServices((prev) => prev.filter((id) => id !== serviceId));
  };

  const formatValue = (value: number, metric: MetricType): string => {
    if (metric === 'availability' || metric === 'errorRate') {
      return formatPercent(value);
    }
    if (metric === 'qps') {
      return formatNumber(Math.round(value));
    }
    return `${Math.round(value)}ms`;
  };

  const currentMetric = metricTabs.find((t) => t.key === selectedMetric);
  const MetricIcon = currentMetric?.icon || Activity;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">指标趋势</h2>
          <p className="mt-1 text-sm text-dark-300">多维度监控指标对比分析</p>
        </div>
      </div>

      <div className="gradient-border p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary-400" />
            <span className="text-sm text-dark-200">指标类型</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {metricTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = selectedMetric === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedMetric(tab.key)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-400 ring-1 ring-inset ring-primary-500/40'
                      : 'bg-dark-800/30 text-dark-200 hover:bg-dark-800/50 hover:text-white'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="gradient-border p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary-400" />
              <span className="text-sm font-medium text-white">时间范围</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {timeRanges.map((range) => (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key)}
                className={`rounded-lg px-4 py-1.5 text-sm transition-all ${
                  timeRange === range.key
                    ? 'bg-primary-500/20 text-primary-400 ring-1 ring-inset ring-primary-500/40'
                    : 'bg-dark-800/30 text-dark-200 hover:bg-dark-800/50 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="gradient-border p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary-400" />
              <span className="text-sm font-medium text-white">服务选择</span>
              <span className="text-xs text-dark-400">（最多5个）</span>
            </div>
          </div>
          <div className="relative mt-3">
            <button
              onClick={() => setServiceDropdownOpen(!serviceDropdownOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-primary-500/20 bg-dark-800/30 px-3 py-2 text-left text-sm transition-colors hover:border-primary-500/40"
            >
              <div className="flex flex-wrap gap-1.5">
                {selectedServices.length === 0 ? (
                  <span className="text-dark-400">选择服务...</span>
                ) : (
                  selectedServices.slice(0, 3).map((id) => {
                    const service = getServiceById(id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-md bg-primary-500/20 px-2 py-0.5 text-xs text-primary-300"
                      >
                        {service?.name || id}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeService(id);
                          }}
                        />
                      </span>
                    );
                  })
                )}
                {selectedServices.length > 3 && (
                  <span className="inline-flex items-center rounded-md bg-dark-700/50 px-2 py-0.5 text-xs text-dark-300">
                    +{selectedServices.length - 3}
                  </span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-dark-400 transition-transform ${serviceDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {serviceDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-primary-500/20 bg-dark-900 shadow-xl">
                <div className="border-b border-primary-500/10 p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" />
                    <input
                      type="text"
                      placeholder="搜索服务..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md bg-dark-800/50 py-1.5 pl-8 pr-3 text-sm text-white placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {filteredServices.map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    const isDisabled = !isSelected && selectedServices.length >= 5;
                    return (
                      <button
                        key={service.id}
                        onClick={() => !isDisabled && toggleService(service.id)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                          isDisabled
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:bg-dark-800/50'
                        }`}
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-dark-500'
                          }`}
                        >
                          {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                        <span className={isSelected ? 'text-white' : 'text-dark-200'}>
                          {service.name}
                        </span>
                        <span className="text-xs text-dark-400">· {service.system}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="gradient-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">趋势图表</h3>
          <div className="flex items-center gap-2 text-xs text-dark-400">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary-400" />
            {currentMetric?.label}趋势
          </div>
        </div>
        {selectedServices.length === 0 ? (
          <div className="flex h-80 items-center justify-center text-dark-400">
            请选择至少一个服务查看趋势
          </div>
        ) : (
          <ReactECharts
            option={chartOption}
            style={{ height: 380, width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat, index) => {
          const service = getServiceById(stat.serviceId);
          const isPositiveTrend = stat.trend >= 0;
          const isGoodTrend =
            selectedMetric === 'availability'
              ? isPositiveTrend
              : selectedMetric === 'errorRate' || selectedMetric === 'responseTime'
              ? !isPositiveTrend
              : isPositiveTrend;

          return (
            <div key={stat.serviceId} className="gradient-border p-4" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: lineColors[index % lineColors.length] }}
                />
                <span className="text-xs text-dark-300 truncate">{service?.name}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">
                  {formatValue(stat.current, selectedMetric)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {isGoodTrend ? (
                  <TrendingDown className="h-3 w-3 text-success-500" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-danger-400" />
                )}
                <span className={`text-xs ${isGoodTrend ? 'text-success-500' : 'text-danger-400'}`}>
                  {stat.trend >= 0 ? '+' : ''}{stat.trend.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {selectedServices.map((serviceId, index) => {
          const service = getServiceById(serviceId);
          const stat = stats.find((s) => s.serviceId === serviceId);
          const color = lineColors[index % lineColors.length];

          return (
            <div key={serviceId} className="gradient-border p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <MetricIcon className="h-4 w-4" style={{ color }} />
                  </div>
                  <span className="text-sm font-medium text-white">{service?.name}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-dark-400">当前值</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {formatValue(stat?.current || 0, selectedMetric)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-400">平均值</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {formatValue(stat?.average || 0, selectedMetric)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-400">峰值</p>
                  <p className="mt-1 text-lg font-bold text-warning-400">
                    {formatValue(stat?.peak || 0, selectedMetric)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-400">谷值</p>
                  <p className="mt-1 text-lg font-bold text-success-500">
                    {formatValue(stat?.valley || 0, selectedMetric)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="gradient-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">服务排名</h3>
          <span className="text-xs text-dark-400">按 {currentMetric?.label} 排序</span>
        </div>
        <div className="space-y-1">
          {rankedServices.slice(0, 10).map((item, index) => {
            const isPositiveTrend = item.trend >= 0;
            const isGoodTrend =
              selectedMetric === 'availability'
                ? isPositiveTrend
                : selectedMetric === 'errorRate' || selectedMetric === 'responseTime'
                ? !isPositiveTrend
                : isPositiveTrend;

            return (
              <div
                key={item.service.id}
                className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-dark-800/30"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                      index === 0
                        ? 'bg-warning-500/20 text-warning-400'
                        : index === 1
                        ? 'bg-dark-400/20 text-dark-300'
                        : index === 2
                        ? 'bg-warning-700/20 text-warning-600'
                        : 'bg-dark-700/30 text-dark-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{item.service.name}</p>
                    <p className="text-xs text-dark-400">{item.service.system}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {formatValue(item.current, selectedMetric)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs ${isGoodTrend ? 'text-success-500' : 'text-danger-400'}`}>
                    {isPositiveTrend ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    <span>{Math.abs(item.trend).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
