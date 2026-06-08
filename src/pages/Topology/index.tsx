import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Search, Star, X, ArrowRight, Activity, Clock, AlertTriangle, Zap, Server, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { Service, ServiceStatus } from '@/types';
import { cn } from '@/lib/utils';

interface NodePosition {
  x: number;
  y: number;
}

interface EdgeInfo {
  from: string;
  to: string;
  callCount: number;
  avgResponseTime: number;
  errorRate: number;
}

const statusColors: Record<ServiceStatus, { fill: string; glow: string; ring: string }> = {
  healthy: { fill: '#00e396', glow: 'rgba(0, 227, 150, 0.6)', ring: 'rgba(0, 227, 150, 0.3)' },
  warning: { fill: '#ff9f43', glow: 'rgba(255, 159, 67, 0.6)', ring: 'rgba(255, 159, 67, 0.3)' },
  critical: { fill: '#ff4d6d', glow: 'rgba(255, 77, 109, 0.6)', ring: 'rgba(255, 77, 109, 0.3)' },
  offline: { fill: '#6b7280', glow: 'rgba(107, 114, 128, 0.3)', ring: 'rgba(107, 114, 128, 0.2)' },
};

const systems = ['全部', '交易系统', '用户系统', '支付系统', '物流系统', '营销系统'];

export default function Topology() {
  const { services, toggleFavorite, getServiceById } = useAppStore();

  const [selectedSystem, setSelectedSystem] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOffline, setShowOffline] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeInfo | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [systemDropdownOpen, setSystemDropdownOpen] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (!showOffline && s.status === 'offline') return false;
      if (selectedSystem !== '全部' && s.system !== selectedSystem) return false;
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [services, selectedSystem, searchQuery, showOffline]);

  const edges = useMemo(() => {
    const edgeMap = new Map<string, EdgeInfo>();
    filteredServices.forEach((service) => {
      service.dependencies.forEach((depId) => {
        if (filteredServices.some((s) => s.id === depId)) {
          const key = `${depId}-${service.id}`;
          const fromSvc = getServiceById(depId);
          const toSvc = service;
          edgeMap.set(key, {
            from: depId,
            to: service.id,
            callCount: Math.floor(Math.random() * 50000) + 10000,
            avgResponseTime: Math.floor((fromSvc?.avgResponseTime || 100 + toSvc?.avgResponseTime || 100) / 2),
            errorRate: Number(((fromSvc?.errorRate || 0 + toSvc?.errorRate || 0) / 2).toFixed(2)),
          });
        }
      });
    });
    return Array.from(edgeMap.values());
  }, [filteredServices, getServiceById]);

  useEffect(() => {
    const positions: Record<string, NodePosition> = {};
    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    const systemGroups: Record<string, Service[]> = {};
    filteredServices.forEach((s) => {
      if (!systemGroups[s.system]) systemGroups[s.system] = [];
      systemGroups[s.system].push(s);
    });

    const systemNames = Object.keys(systemGroups);
    const angleStep = (2 * Math.PI) / Math.max(systemNames.length, 1);
    const radius = Math.min(width, height) * 0.35;

    systemNames.forEach((systemName, sysIdx) => {
      const systemAngle = sysIdx * angleStep - Math.PI / 2;
      const systemServices = systemGroups[systemName];
      const serviceCount = systemServices.length;
      const innerRadius = 80;

      systemServices.forEach((service, svcIdx) => {
        const serviceAngle = serviceCount > 1 
          ? systemAngle + (svcIdx - (serviceCount - 1) / 2) * 0.4
          : systemAngle;
        const distance = radius + (svcIdx % 2 === 0 ? 0 : innerRadius * 0.5);
        
        positions[service.id] = {
          x: centerX + Math.cos(serviceAngle) * distance,
          y: centerY + Math.sin(serviceAngle) * distance,
        };
      });
    });

    setNodePositions(positions);
  }, [filteredServices.map(s => s.id).join(',')]);

  const getNodeRadius = useCallback((serviceId: string) => {
    const baseRadius = 28;
    const isHovered = hoveredNode === serviceId;
    const isSelected = selectedService?.id === serviceId;
    return baseRadius + (isHovered || isSelected ? 8 : 0);
  }, [hoveredNode, selectedService]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(0.3, Math.min(3, prev * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, serviceId?: string) => {
    if (serviceId) {
      setDraggingNode(serviceId);
      setSelectedService(getServiceById(serviceId) || null);
      setSelectedEdge(null);
    } else {
      setIsPanning(true);
      setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  }, [translate, getServiceById]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNode && svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left - translate.x) / scale;
      const y = (e.clientY - rect.top - translate.y) / scale;

      setNodePositions((prev) => ({
        ...prev,
        [draggingNode]: { x, y },
      }));
    } else if (isPanning) {
      setTranslate({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [draggingNode, isPanning, panStart, scale, translate]);

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
    setIsPanning(false);
  }, []);

  const handleEdgeClick = useCallback((edge: EdgeInfo) => {
    setSelectedEdge(edge);
    setSelectedService(null);
  }, []);

  const getEdgePath = useCallback((fromId: string, toId: string) => {
    const from = nodePositions[fromId];
    const to = nodePositions[toId];
    if (!from || !to) return '';

    const fromRadius = getNodeRadius(fromId);
    const toRadius = getNodeRadius(toId);

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return '';

    const startX = from.x + (dx / dist) * fromRadius;
    const startY = from.y + (dy / dist) * fromRadius;
    const endX = to.x - (dx / dist) * (toRadius + 10);
    const endY = to.y - (dy / dist) * (toRadius + 10);

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const perpX = -dy / dist * 20;
    const perpY = dx / dist * 20;

    return `M ${startX} ${startY} Q ${midX + perpX} ${midY + perpY} ${endX} ${endY}`;
  }, [nodePositions, getNodeRadius]);

  const getStatusLabel = (status: ServiceStatus) => {
    const labels: Record<ServiceStatus, string> = {
      healthy: '正常',
      warning: '告警',
      critical: '故障',
      offline: '离线',
    };
    return labels[status];
  };

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="glass-strong rounded-xl p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setSystemDropdownOpen(!systemDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-dark-100 hover:border-primary-500/50 transition-colors min-w-[140px]"
            >
              <Server size={16} className="text-primary-400" />
              <span className="text-sm">{selectedSystem}</span>
              <ChevronDown size={14} className="ml-auto text-dark-400" />
            </button>
            {systemDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full glass-strong rounded-lg border border-dark-700 z-20 overflow-hidden">
                {systems.map((sys) => (
                  <button
                    key={sys}
                    onClick={() => {
                      setSelectedSystem(sys);
                      setSystemDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-dark-700/50 transition-colors',
                      selectedSystem === sys ? 'text-primary-400 bg-primary-500/10' : 'text-dark-100'
                    )}
                  >
                    {sys}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="搜索服务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-300">显示离线服务</span>
            <div
              onClick={() => setShowOffline(!showOffline)}
              className={cn('toggle-switch', showOffline ? 'active' : 'inactive')}
            >
              <span className="toggle-switch-knob" />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4 text-sm text-dark-300">
            <span>共 {filteredServices.length} 个服务</span>
            <span>{edges.length} 条调用关系</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative glass-strong rounded-xl overflow-hidden">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" onWheel={handleWheel}>
          <svg
            ref={svgRef}
            className="w-full h-full"
            onMouseDown={(e) => handleMouseDown(e)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(0, 212, 255, 0.5)" />
              </marker>
              
              <marker
                id="arrowhead-active"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#00d4ff" />
              </marker>

              <radialGradient id="nodeGlow-healthy">
                <stop offset="0%" stopColor="#00e396" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00e396" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nodeGlow-warning">
                <stop offset="0%" stopColor="#ff9f43" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ff9f43" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nodeGlow-critical">
                <stop offset="0%" stopColor="#ff4d6d" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ff4d6d" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nodeGlow-offline">
                <stop offset="0%" stopColor="#6b7280" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#6b7280" stopOpacity="0" />
              </radialGradient>
            </defs>

            <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
              {edges.map((edge) => {
                const isSelected = selectedEdge?.from === edge.from && selectedEdge?.to === edge.to;
                const isHighlighted = 
                  selectedService && 
                  (edge.from === selectedService.id || edge.to === selectedService.id);
                const isDimmed = selectedService && !isHighlighted;

                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    <path
                      d={getEdgePath(edge.from, edge.to)}
                      fill="none"
                      stroke={isSelected ? '#00d4ff' : isHighlighted ? 'rgba(0, 212, 255, 0.7)' : 'rgba(0, 212, 255, 0.2)'}
                      strokeWidth={isSelected ? 2.5 : isHighlighted ? 2 : 1}
                      markerEnd={isSelected ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                      opacity={isDimmed ? 0.2 : 1}
                      className="cursor-pointer transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdgeClick(edge);
                      }}
                      style={{ pointerEvents: 'stroke' }}
                    />
                  </g>
                );
              })}

              {filteredServices.map((service) => {
                const pos = nodePositions[service.id];
                if (!pos) return null;

                const colors = statusColors[service.status];
                const radius = getNodeRadius(service.id);
                const glowRadius = radius + 20;
                const isSelected = selectedService?.id === service.id;
                const isDimmed = selectedService && !isSelected && 
                  !edges.some(e => 
                    (e.from === selectedService.id && e.to === service.id) ||
                    (e.to === selectedService.id && e.from === service.id)
                  );

                return (
                  <g
                    key={service.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, service.id);
                    }}
                    onMouseEnter={() => setHoveredNode(service.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{
                      opacity: isDimmed ? 0.4 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <circle
                      r={glowRadius}
                      fill={`url(#nodeGlow-${service.status})`}
                      style={{
                        transform: 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    />

                    <circle
                      r={radius}
                      fill={colors.fill}
                      filter="url(#glow)"
                      style={{
                        transition: 'r 0.2s ease',
                      }}
                    />

                    <circle
                      r={radius - 6}
                      fill="rgba(10, 22, 40, 0.8)"
                    />

                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={colors.fill}
                      fontSize="11"
                      fontWeight="600"
                    >
                      {service.name.slice(0, 2)}
                    </text>

                    <text
                      y={radius + 16}
                      textAnchor="middle"
                      fill="#e0e7ff"
                      fontSize="11"
                      fontWeight="500"
                    >
                      {service.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <div className="absolute bottom-4 left-4 flex items-center gap-2 glass rounded-lg px-3 py-2">
          <button
            onClick={() => setScale((s) => Math.min(3, s * 1.2))}
            className="w-8 h-8 flex items-center justify-center rounded bg-dark-800/50 text-dark-200 hover:bg-dark-700/50 transition-colors"
          >
            +
          </button>
          <span className="text-sm text-dark-300 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.max(0.3, s * 0.8))}
            className="w-8 h-8 flex items-center justify-center rounded bg-dark-800/50 text-dark-200 hover:bg-dark-700/50 transition-colors"
          >
            −
          </button>
          <div className="w-px h-6 bg-dark-700 mx-1" />
          <button
            onClick={() => {
              setScale(1);
              setTranslate({ x: 0, y: 0 });
            }}
            className="text-xs text-dark-300 hover:text-primary-400 transition-colors"
          >
            重置视图
          </button>
        </div>

        <div className="absolute top-4 left-4 glass rounded-lg px-3 py-2">
          <div className="flex items-center gap-3 text-xs">
            {Object.entries(statusColors).map(([status, colors]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: colors.fill, boxShadow: `0 0 6px ${colors.glow}` }}
                />
                <span className="text-dark-300">{getStatusLabel(status as ServiceStatus)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'absolute top-0 right-0 h-full w-80 glass-strong border-l border-dark-700 z-30 transform transition-transform duration-300 ease-out',
          selectedService ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {selectedService && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-dark-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark-100">服务详情</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavorite(selectedService.id)}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    selectedService.isFavorite
                      ? 'text-yellow-400 hover:bg-yellow-500/10'
                      : 'text-dark-400 hover:bg-dark-700/50'
                  )}
                >
                  <Star size={18} fill={selectedService.isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => setSelectedService(null)}
                  className="p-1.5 rounded-lg text-dark-400 hover:bg-dark-700/50 hover:text-dark-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: statusColors[selectedService.status].fill,
                      boxShadow: `0 0 8px ${statusColors[selectedService.status].glow}`,
                    }}
                  />
                  <h4 className="text-xl font-bold text-dark-50">{selectedService.name}</h4>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded-full text-xs">
                    {selectedService.system}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs',
                    selectedService.status === 'healthy' && 'bg-success-500/20 text-success-500',
                    selectedService.status === 'warning' && 'bg-warning-500/20 text-warning-500',
                    selectedService.status === 'critical' && 'bg-danger-500/20 text-danger-400',
                    selectedService.status === 'offline' && 'bg-dark-700 text-dark-400',
                  )}>
                    {getStatusLabel(selectedService.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-dark-400 text-xs mb-1">
                    <Activity size={12} />
                    <span>可用率</span>
                  </div>
                  <div className="text-xl font-bold text-success-500">
                    {selectedService.availability.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-dark-400 text-xs mb-1">
                    <Clock size={12} />
                    <span>响应时间</span>
                  </div>
                  <div className="text-xl font-bold text-primary-400">
                    {selectedService.avgResponseTime}ms
                  </div>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-dark-400 text-xs mb-1">
                    <AlertTriangle size={12} />
                    <span>错误率</span>
                  </div>
                  <div className={cn(
                    'text-xl font-bold',
                    selectedService.errorRate < 1 ? 'text-success-500' :
                    selectedService.errorRate < 3 ? 'text-warning-500' : 'text-danger-400'
                  )}>
                    {selectedService.errorRate}%
                  </div>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-dark-400 text-xs mb-1">
                    <Zap size={12} />
                    <span>QPS</span>
                  </div>
                  <div className="text-xl font-bold text-primary-400">
                    {selectedService.qps.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-medium text-dark-200 flex items-center gap-2">
                  <ArrowRight size={14} className="text-primary-400 rotate-180" />
                  依赖服务 ({selectedService.dependencies.length})
                </h5>
                <div className="space-y-1">
                  {selectedService.dependencies.length > 0 ? (
                    selectedService.dependencies.map((depId) => {
                      const dep = getServiceById(depId);
                      if (!dep) return null;
                      return (
                        <button
                          key={depId}
                          onClick={() => setSelectedService(dep)}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-dark-800/30 hover:bg-dark-700/50 rounded-lg text-left transition-colors"
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: statusColors[dep.status].fill }}
                          />
                          <span className="text-sm text-dark-100 flex-1">{dep.name}</span>
                          <span className="text-xs text-dark-400">{dep.system}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-sm text-dark-500 px-3 py-2">无依赖服务</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-medium text-dark-200 flex items-center gap-2">
                  <ArrowRight size={14} className="text-primary-400" />
                  被依赖服务 ({selectedService.dependents.length})
                </h5>
                <div className="space-y-1">
                  {selectedService.dependents.length > 0 ? (
                    selectedService.dependents.map((depId) => {
                      const dep = getServiceById(depId);
                      if (!dep) return null;
                      return (
                        <button
                          key={depId}
                          onClick={() => setSelectedService(dep)}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-dark-800/30 hover:bg-dark-700/50 rounded-lg text-left transition-colors"
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: statusColors[dep.status].fill }}
                          />
                          <span className="text-sm text-dark-100 flex-1">{dep.name}</span>
                          <span className="text-xs text-dark-400">{dep.system}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-sm text-dark-500 px-3 py-2">无被依赖服务</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedEdge && (
        <div
          className={cn(
            'absolute top-0 right-0 h-full w-72 glass-strong border-l border-dark-700 z-30 transform transition-transform duration-300 ease-out',
            selectedService ? 'translate-x-80' : 'translate-x-0'
          )}
          style={{ right: selectedService ? '320px' : 0 }}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-dark-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark-100">调用关系</h3>
              <button
                onClick={() => setSelectedEdge(null)}
                className="p-1.5 rounded-lg text-dark-400 hover:bg-dark-700/50 hover:text-dark-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-right">
                    <div className="text-sm font-medium text-dark-100">
                      {getServiceById(selectedEdge.from)?.name}
                    </div>
                    <div className="text-xs text-dark-400">
                      {getServiceById(selectedEdge.from)?.system}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-primary-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-dark-100">
                      {getServiceById(selectedEdge.to)?.name}
                    </div>
                    <div className="text-xs text-dark-400">
                      {getServiceById(selectedEdge.to)?.system}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-dark-800/50 rounded-lg p-3">
                  <div className="text-dark-400 text-xs mb-1">调用量</div>
                  <div className="text-xl font-bold text-primary-400">
                    {selectedEdge.callCount.toLocaleString()}
                    <span className="text-xs text-dark-400 ml-1">次/日</span>
                  </div>
                </div>

                <div className="bg-dark-800/50 rounded-lg p-3">
                  <div className="text-dark-400 text-xs mb-1">平均响应时间</div>
                  <div className="text-xl font-bold text-success-500">
                    {selectedEdge.avgResponseTime}
                    <span className="text-xs text-dark-400 ml-1">ms</span>
                  </div>
                </div>

                <div className="bg-dark-800/50 rounded-lg p-3">
                  <div className="text-dark-400 text-xs mb-1">错误率</div>
                  <div className={cn(
                    'text-xl font-bold',
                    selectedEdge.errorRate < 1 ? 'text-success-500' :
                    selectedEdge.errorRate < 3 ? 'text-warning-500' : 'text-danger-400'
                  )}>
                    {selectedEdge.errorRate}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
