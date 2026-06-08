import { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertTriangle,
  Zap,
  Rocket,
  CheckCircle2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  Shield,
  User,
  Server,
  ChevronDown,
  AlertOctagon,
  Activity,
  Timer,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { formatDateTime, formatDuration } from '@/utils/format';
import type { Event, EventType, Incident, IncidentSeverity, IncidentStatus } from '@/types';

const eventTypeIcons: Record<EventType, React.ReactNode> = {
  alert: <AlertTriangle className="h-4 w-4" />,
  action: <Zap className="h-4 w-4" />,
  deployment: <Rocket className="h-4 w-4" />,
  resolution: <CheckCircle2 className="h-4 w-4" />,
};

const eventTypeColors: Record<EventType, { bg: string; border: string; text: string; glow: string }> = {
  alert: {
    bg: 'bg-danger-500/20',
    border: 'border-danger-500/50',
    text: 'text-danger-400',
    glow: 'shadow-glow-danger',
  },
  action: {
    bg: 'bg-warning-500/20',
    border: 'border-warning-500/50',
    text: 'text-warning-500',
    glow: 'shadow-glow-warning',
  },
  deployment: {
    bg: 'bg-primary-500/20',
    border: 'border-primary-500/50',
    text: 'text-primary-400',
    glow: 'shadow-glow-primary',
  },
  resolution: {
    bg: 'bg-success-500/20',
    border: 'border-success-500/50',
    text: 'text-success-500',
    glow: 'shadow-glow-success',
  },
};

const eventTypeLabels: Record<EventType, string> = {
  alert: '告警',
  action: '操作',
  deployment: '部署',
  resolution: '恢复',
};

const severityLabels: Record<IncidentSeverity, string> = {
  critical: '严重',
  major: '主要',
  minor: '次要',
};

const severityColors: Record<IncidentSeverity, string> = {
  critical: 'text-danger-400 bg-danger-500/20 border-danger-500/30',
  major: 'text-warning-500 bg-warning-500/20 border-warning-500/30',
  minor: 'text-primary-400 bg-primary-500/20 border-primary-500/30',
};

const statusLabels: Record<IncidentStatus, string> = {
  ongoing: '进行中',
  resolved: '已解决',
};

const statusColors: Record<IncidentStatus, string> = {
  ongoing: 'text-danger-400',
  resolved: 'text-success-500',
};

const playbackSpeeds = [0.5, 1, 2, 4];

export default function EventTimeline() {
  const { incidents, getServiceById } = useAppStore();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || '');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState(-1);
  const [showIncidentDropdown, setShowIncidentDropdown] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const selectedIncident = useMemo(() => {
    return incidents.find((inc) => inc.id === selectedIncidentId) || incidents[0];
  }, [incidents, selectedIncidentId]);

  const sortedEvents = useMemo(() => {
    if (!selectedIncident) return [];
    return [...selectedIncident.events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [selectedIncident]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return sortedEvents.find((e) => e.id === selectedEventId) || null;
  }, [selectedEventId, sortedEvents]);

  const affectedServices = useMemo(() => {
    if (!selectedIncident) return [];
    return selectedIncident.affectedServices
      .map((id) => getServiceById(id))
      .filter(Boolean);
  }, [selectedIncident, getServiceById]);

  const totalDuration = useMemo(() => {
    if (!selectedIncident || sortedEvents.length === 0) return 0;
    const start = new Date(sortedEvents[0].timestamp).getTime();
    const end = new Date(sortedEvents[sortedEvents.length - 1].timestamp).getTime();
    return end - start;
  }, [selectedIncident, sortedEvents]);

  const incidentDuration = useMemo(() => {
    if (!selectedIncident) return 0;
    const start = new Date(selectedIncident.startTime).getTime();
    const end = selectedIncident.endTime
      ? new Date(selectedIncident.endTime).getTime()
      : Date.now();
    return end - start;
  }, [selectedIncident]);

  useEffect(() => {
    if (!isPlaying || sortedEvents.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setPlaybackProgress((prev) => {
        const baseSpeed = 0.001 * playbackSpeed;
        const newProgress = prev + delta * baseSpeed;

        if (newProgress >= 1) {
          setIsPlaying(false);
          setCurrentPlaybackIndex(sortedEvents.length - 1);
          return 1;
        }

        const newIndex = Math.floor(newProgress * sortedEvents.length);
        if (newIndex !== currentPlaybackIndex && newIndex < sortedEvents.length) {
          setCurrentPlaybackIndex(newIndex);
          setSelectedEventId(sortedEvents[newIndex].id);
        }

        return newProgress;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, sortedEvents, currentPlaybackIndex]);

  useEffect(() => {
    setSelectedEventId(null);
    setCurrentPlaybackIndex(-1);
    setPlaybackProgress(0);
    setIsPlaying(false);
  }, [selectedIncidentId]);

  const handlePlayPause = () => {
    if (playbackProgress >= 1) {
      setPlaybackProgress(0);
      setCurrentPlaybackIndex(-1);
      setSelectedEventId(null);
    }
    lastTimeRef.current = 0;
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    setPlaybackProgress(progress);
    const index = Math.min(
      Math.floor(progress * sortedEvents.length),
      sortedEvents.length - 1
    );
    if (index >= 0) {
      setCurrentPlaybackIndex(index);
      setSelectedEventId(sortedEvents[index].id);
    }
  };

  const handleSkipBack = () => {
    if (currentPlaybackIndex > 0) {
      const newIndex = currentPlaybackIndex - 1;
      setCurrentPlaybackIndex(newIndex);
      setSelectedEventId(sortedEvents[newIndex].id);
      setPlaybackProgress(newIndex / sortedEvents.length);
    }
  };

  const handleSkipForward = () => {
    if (currentPlaybackIndex < sortedEvents.length - 1) {
      const newIndex = currentPlaybackIndex + 1;
      setCurrentPlaybackIndex(newIndex);
      setSelectedEventId(sortedEvents[newIndex].id);
      setPlaybackProgress((newIndex + 1) / sortedEvents.length);
    }
  };

  const handleEventClick = (event: Event, index: number) => {
    setSelectedEventId(event.id);
    setCurrentPlaybackIndex(index);
    setPlaybackProgress((index + 1) / sortedEvents.length);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const formatPlaybackTime = (progress: number) => {
    if (totalDuration === 0) return '00:00';
    const elapsedMs = totalDuration * progress;
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (!selectedIncident) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-dark-400">暂无事故数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="gradient-border p-5 stagger-item">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">事件时间线</h1>
            <p className="mt-1 text-sm text-dark-400">查看事故完整时间线和事件回放</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowIncidentDropdown(!showIncidentDropdown)}
              className="flex min-w-[320px] items-center justify-between rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-3 text-left transition-colors hover:border-primary-500/30"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    selectedIncident.status === 'ongoing' ? 'bg-danger-500 animate-pulse' : 'bg-success-500'
                  }`} />
                  <span className={`text-sm font-medium ${statusColors[selectedIncident.status]}`}>
                    {statusLabels[selectedIncident.status]}
                  </span>
                  <span className={`tag border ${severityColors[selectedIncident.severity]}`}>
                    {severityLabels[selectedIncident.severity]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-white">{selectedIncident.title}</p>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-dark-400 transition-transform ${
                  showIncidentDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showIncidentDropdown && (
              <div className="absolute z-10 mt-2 w-full rounded-lg border border-dark-700 bg-dark-800/95 py-1 shadow-lg backdrop-blur-sm">
                {incidents.map((incident) => (
                  <button
                    key={incident.id}
                    onClick={() => {
                      setSelectedIncidentId(incident.id);
                      setShowIncidentDropdown(false);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-dark-700/50 ${
                      incident.id === selectedIncidentId ? 'bg-primary-500/10' : ''
                    }`}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${
                      incident.status === 'ongoing' ? 'bg-danger-500 animate-pulse' : 'bg-success-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${statusColors[incident.status]}`}>
                          {statusLabels[incident.status]}
                        </span>
                        <span className={`tag border text-[10px] ${severityColors[incident.severity]}`}>
                          {severityLabels[incident.severity]}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-white">{incident.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="gradient-border p-5 stagger-item" style={{ animationDelay: '100ms' }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">时间轴</h3>
              <span className="text-xs text-dark-400">
                共 {sortedEvents.length} 个事件
              </span>
            </div>

            <div className="relative max-h-[500px] overflow-y-auto pr-2">
              <div className="absolute left-5 top-0 h-full w-0.5 bg-gradient-to-b from-primary-500/30 via-dark-700 to-dark-700" />

              <div className="space-y-1">
                {sortedEvents.map((event, index) => {
                  const colors = eventTypeColors[event.type];
                  const isHighlighted = index <= currentPlaybackIndex;
                  const isSelected = selectedEventId === event.id;
                  const isCurrent = currentPlaybackIndex === index;

                  return (
                    <div
                      key={event.id}
                      className={`relative flex gap-4 py-3 pl-12 pr-3 rounded-lg cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? 'bg-primary-500/10'
                          : 'hover:bg-dark-800/30'
                      } ${isCurrent ? 'scale-[1.02]' : ''}`}
                      onClick={() => handleEventClick(event, index)}
                    >
                      <div
                        className={`absolute left-3 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          colors.bg
                        } ${colors.border} ${colors.text} ${
                          isHighlighted ? colors.glow : 'opacity-60'
                        } ${isCurrent ? 'scale-125 animate-pulse' : ''}`}
                      >
                        {eventTypeIcons[event.type]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium ${colors.text}`}>
                            {eventTypeLabels[event.type]}
                          </span>
                          <span className="text-xs text-dark-500">
                            {formatDateTime(event.timestamp)}
                          </span>
                        </div>
                        <h4
                          className={`mt-1 text-sm font-medium transition-colors ${
                            isHighlighted ? 'text-white' : 'text-dark-300'
                          }`}
                        >
                          {event.title}
                        </h4>
                        <p
                          className={`mt-1 text-xs transition-colors ${
                            isSelected || isHighlighted ? 'text-dark-300' : 'text-dark-500'
                          } ${isSelected ? 'line-clamp-none' : 'line-clamp-2'}`}
                        >
                          {event.description}
                        </p>

                        {isSelected && event.author && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-dark-400">
                            <User className="h-3 w-3" />
                            <span>操作人：{event.author}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="gradient-border p-5 stagger-item" style={{ animationDelay: '200ms' }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">回放控制</h3>
              <div className="flex items-center gap-2">
                {playbackSpeeds.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-primary-500/30 text-primary-400 border border-primary-500/50'
                        : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div
                className="relative h-2 cursor-pointer rounded-full bg-dark-700"
                onClick={handleProgressClick}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all"
                  style={{ width: `${playbackProgress * 100}%` }}
                />
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-400 shadow-glow-primary transition-all"
                  style={{ left: `${playbackProgress * 100}%` }}
                />

                <div className="absolute top-6 left-0 right-0 flex justify-between">
                  {sortedEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="absolute -translate-x-1/2"
                      style={{ left: `${(index / (sortedEvents.length - 1 || 1)) * 100}%` }}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          index <= currentPlaybackIndex
                            ? 'bg-primary-400'
                            : 'bg-dark-600'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSkipBack}
                    disabled={currentPlaybackIndex <= 0}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-700/50 text-dark-300 transition-colors hover:bg-dark-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/20 text-primary-400 shadow-glow-primary transition-all hover:bg-primary-500/30 hover:scale-105"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={handleSkipForward}
                    disabled={currentPlaybackIndex >= sortedEvents.length - 1}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-700/50 text-dark-300 transition-colors hover:bg-dark-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-dark-400 font-mono">
                  <Clock className="h-4 w-4" />
                  <span>{formatPlaybackTime(playbackProgress)}</span>
                  <span className="text-dark-600">/</span>
                  <span>{formatPlaybackTime(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="gradient-border p-5 stagger-item" style={{ animationDelay: '300ms' }}>
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-400" />
              <h3 className="text-base font-semibold text-white">影响范围</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-dark-400">事故级别</p>
                <div className="mt-1 flex items-center gap-2">
                  <AlertOctagon
                    className={`h-4 w-4 ${
                      selectedIncident.severity === 'critical'
                        ? 'text-danger-400'
                        : selectedIncident.severity === 'major'
                        ? 'text-warning-500'
                        : 'text-primary-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      selectedIncident.severity === 'critical'
                        ? 'text-danger-400'
                        : selectedIncident.severity === 'major'
                        ? 'text-warning-500'
                        : 'text-primary-400'
                    }`}
                  >
                    {severityLabels[selectedIncident.severity]}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-dark-400">持续时间</p>
                <div className="mt-1 flex items-center gap-2">
                  <Timer className="h-4 w-4 text-dark-300" />
                  <span className="text-sm font-medium text-white">
                    {formatDuration(incidentDuration)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-dark-400">受影响服务</p>
                <div className="mt-2 space-y-2">
                  {affectedServices.map((service) =>
                    service ? (
                      <div
                        key={service.id}
                        className="flex items-center gap-2 rounded-lg bg-dark-800/30 px-3 py-2"
                      >
                        <div className={`status-dot ${service.status}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{service.name}</p>
                          <p className="text-xs text-dark-500">{service.system}</p>
                        </div>
                        <Server className="h-4 w-4 text-dark-500" />
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-dark-400">影响描述</p>
                <p className="mt-1 text-sm text-dark-200 leading-relaxed">
                  {selectedIncident.impactScope}
                </p>
              </div>
            </div>
          </div>

          <div className="gradient-border p-5 stagger-item" style={{ animationDelay: '400ms' }}>
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-400" />
              <h3 className="text-base font-semibold text-white">事件详情</h3>
            </div>

            {selectedEvent ? (
              <div className="space-y-4">
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    eventTypeColors[selectedEvent.type].bg
                  } ${eventTypeColors[selectedEvent.type].text} ${
                    eventTypeColors[selectedEvent.type].border
                  } border`}
                >
                  {eventTypeIcons[selectedEvent.type]}
                  {eventTypeLabels[selectedEvent.type]}
                </div>

                <div>
                  <h4 className="text-base font-medium text-white">
                    {selectedEvent.title}
                  </h4>
                  <p className="mt-1 text-xs text-dark-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(selectedEvent.timestamp)}
                  </p>
                </div>

                <div className="rounded-lg bg-dark-800/30 p-3">
                  <p className="text-xs text-dark-400 mb-1">事件描述</p>
                  <p className="text-sm text-dark-200 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>

                {selectedEvent.author && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20">
                      <User className="h-4 w-4 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white">{selectedEvent.author}</p>
                      <p className="text-xs text-dark-500">操作人</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-dark-400 mb-2">涉及服务</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEvent.serviceIds.map((serviceId) => {
                      const service = getServiceById(serviceId);
                      return (
                        <span
                          key={serviceId}
                          className="inline-flex items-center gap-1 rounded-md bg-dark-700/50 px-2 py-1 text-xs text-dark-300"
                        >
                          <Server className="h-3 w-3" />
                          {service?.name || serviceId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dark-700/50 mb-3">
                  <Clock className="h-6 w-6 text-dark-500" />
                </div>
                <p className="text-sm text-dark-400">点击时间轴节点查看详情</p>
                <p className="text-xs text-dark-600 mt-1">或使用回放控制自动播放</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
