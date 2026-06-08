import type { MetricData, MetricType } from '../types';

const services = [
  { id: 'svc-001', name: '用户服务' },
  { id: 'svc-002', name: '订单服务' },
  { id: 'svc-003', name: '支付服务' },
  { id: 'svc-004', name: '商品服务' },
  { id: 'svc-005', name: '库存服务' },
  { id: 'svc-006', name: '消息服务' },
  { id: 'svc-007', name: '搜索服务' },
  { id: 'svc-008', name: '推荐服务' },
  { id: 'svc-009', name: '网关服务' },
  { id: 'svc-010', name: '认证服务' },
  { id: 'svc-011', name: '日志服务' },
  { id: 'svc-012', name: '配置中心' },
];

const generateDataPoints = (
  baseValue: number,
  variance: number,
  metricType: MetricType
) => {
  const points: { timestamp: number; value: number }[] = [];
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  const count = 288;

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - i * fiveMinutes;
    const hourOfDay = new Date(timestamp).getHours();
    const hourFactor =
      hourOfDay >= 9 && hourOfDay <= 21
        ? 1 + 0.4 * Math.sin(((hourOfDay - 9) / 12) * Math.PI)
        : 0.6 + 0.2 * Math.sin(((hourOfDay + 3) / 12) * Math.PI);

    const noise = (Math.random() - 0.5) * variance;
    let value = baseValue * hourFactor + noise;

    if (metricType === 'availability') {
      value = Math.max(95, Math.min(100, 100 - Math.abs(noise) * 0.1));
    } else if (metricType === 'errorRate') {
      value = Math.max(0, Math.min(10, Math.abs(value)));
    } else if (metricType === 'responseTime') {
      value = Math.max(10, value);
    } else if (metricType === 'qps') {
      value = Math.max(1, value);
    }

    points.push({
      timestamp,
      value: Math.round(value * 100) / 100,
    });
  }

  return points;
};

const generateMetricsForService = (serviceId: string): MetricData[] => {
  const configs: Record<MetricType, { base: number; variance: number }> = {
    responseTime: { base: 80 + Math.random() * 120, variance: 30 },
    errorRate: { base: 0.5 + Math.random() * 2, variance: 1 },
    qps: { base: 100 + Math.random() * 500, variance: 100 },
    availability: { base: 99.9, variance: 0.5 },
  };

  return (Object.keys(configs) as MetricType[]).map((metric) => ({
    serviceId,
    metric,
    data: generateDataPoints(configs[metric].base, configs[metric].variance, metric),
  }));
};

export const metricsData: MetricData[] = services.flatMap((service) =>
  generateMetricsForService(service.id)
);
