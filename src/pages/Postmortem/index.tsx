import { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  X,
  Save,
  Send,
  ChevronDown,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock as ClockIcon,
  PlayCircle,
  Target,
  Zap,
  Shield,
  Bell,
  BarChart3,
  Lightbulb,
  Wand2,
  MessageSquare,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { formatDateTime, formatRelativeTime } from '@/utils/format';
import type { PostmortemReport, PostmortemStatus, ActionItem, IncidentSeverity } from '@/types';

const severityConfig: Record<IncidentSeverity, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof AlertTriangle }> = {
  critical: {
    label: '严重',
    color: 'text-danger-500',
    bgColor: 'bg-danger-500/10',
    borderColor: 'border-danger-500/30',
    icon: AlertTriangle,
  },
  major: {
    label: '主要',
    color: 'text-warning-500',
    bgColor: 'bg-warning-500/10',
    borderColor: 'border-warning-500/30',
    icon: AlertCircle,
  },
  minor: {
    label: '次要',
    color: 'text-primary-500',
    bgColor: 'bg-primary-500/10',
    borderColor: 'border-primary-500/30',
    icon: Info,
  },
};

const statusConfig: Record<PostmortemStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  draft: {
    label: '草稿',
    color: 'text-dark-300',
    bgColor: 'bg-dark-700/50',
    borderColor: 'border-dark-600/50',
  },
  published: {
    label: '已发布',
    color: 'text-success-500',
    bgColor: 'bg-success-500/10',
    borderColor: 'border-success-500/30',
  },
};

const actionItemStatusConfig = {
  pending: {
    label: '待处理',
    color: 'text-dark-300',
    bgColor: 'bg-dark-700/50',
    borderColor: 'border-dark-600/50',
    icon: ClockIcon,
  },
  'in-progress': {
    label: '进行中',
    color: 'text-warning-500',
    bgColor: 'bg-warning-500/10',
    borderColor: 'border-warning-500/30',
    icon: PlayCircle,
  },
  completed: {
    label: '已完成',
    color: 'text-success-500',
    bgColor: 'bg-success-500/10',
    borderColor: 'border-success-500/30',
    icon: CheckCircle,
  },
};

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
          <div className="absolute top-full left-0 mt-1 z-20 py-1 rounded-lg bg-dark-800 border border-dark-600/50 shadow-card-dark min-w-[120px]">
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

interface PostmortemCardProps {
  report: PostmortemReport;
  severity?: IncidentSeverity;
  onView: (report: PostmortemReport) => void;
  onEdit: (report: PostmortemReport) => void;
  onDelete: (id: string) => void;
}

function PostmortemCard({ report, severity, onView, onEdit, onDelete }: PostmortemCardProps) {
  const severityInfo = severity ? severityConfig[severity] : severityConfig.minor;
  const statusInfo = statusConfig[report.status];
  const SeverityIcon = severityInfo.icon;

  const summaryLines = report.content.summary.split('\n').slice(0, 2).join('\n');
  const pendingActionCount = report.content.actionItems.filter(
    (item) => item.status !== 'completed'
  ).length;

  return (
    <div className="gradient-border p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 group cursor-pointer"
      onClick={() => onView(report)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
              severityInfo.bgColor,
              severityInfo.borderColor,
              severityInfo.color
            )}>
              <SeverityIcon className="w-3 h-3" />
              {severityInfo.label}
            </span>
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
              statusInfo.bgColor,
              statusInfo.borderColor,
              statusInfo.color
            )}>
              {statusInfo.label}
            </span>
          </div>
          <h3 className="text-white font-medium mb-2 group-hover:text-primary-400 transition-colors line-clamp-2">
            {report.title}
          </h3>
        </div>
      </div>

      <p className="text-dark-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        {summaryLines}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-dark-500 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatRelativeTime(report.createdAt)}
          </span>
          {pendingActionCount > 0 && (
            <span className="flex items-center gap-1 text-warning-500">
              <ClockIcon className="w-3.5 h-3.5" />
              {pendingActionCount} 项待完成
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onView(report); }}
            className="p-1.5 rounded-md text-primary-500 hover:bg-primary-500/10 transition-colors"
            title="查看"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(report); }}
            className="p-1.5 rounded-md text-warning-500 hover:bg-warning-500/10 transition-colors"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(report.id); }}
            className="p-1.5 rounded-md text-danger-500 hover:bg-danger-500/10 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReportDrawerProps {
  report: PostmortemReport | null;
  mode: 'view' | 'edit';
  incidents: { id: string; title: string; severity: IncidentSeverity }[];
  onClose: () => void;
  onSave: (report: PostmortemReport) => void;
  onPublish: (report: PostmortemReport) => void;
}

function ReportDrawer({ report, mode, incidents, onClose, onSave, onPublish }: ReportDrawerProps) {
  const [title, setTitle] = useState(report?.title || '');
  const [incidentId, setIncidentId] = useState(report?.incidentId || '');
  const [summary, setSummary] = useState(report?.content.summary || '');
  const [timeline, setTimeline] = useState(report?.content.timeline || '');
  const [rootCause, setRootCause] = useState(report?.content.rootCause || '');
  const [impact, setImpact] = useState(report?.content.impact || '');
  const [actionItems, setActionItems] = useState<ActionItem[]>(report?.content.actionItems || []);
  const [lessonsLearned, setLessonsLearned] = useState(report?.content.lessonsLearned || '');
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [editingStartSnapshot, setEditingStartSnapshot] = useState<PostmortemReport | null>(null);

  useEffect(() => {
    if (report) {
      setTitle(report.title);
      setIncidentId(report.incidentId);
      setSummary(report.content.summary);
      setTimeline(report.content.timeline);
      setRootCause(report.content.rootCause);
      setImpact(report.content.impact);
      setActionItems(report.content.actionItems);
      setLessonsLearned(report.content.lessonsLearned);
    }
    setIsEditing(mode === 'edit');
    if (mode === 'edit' && report) {
      setEditingStartSnapshot(report);
    }
  }, [report, mode]);

  const handleCancel = () => {
    if (editingStartSnapshot) {
      setTitle(editingStartSnapshot.title);
      setIncidentId(editingStartSnapshot.incidentId);
      setSummary(editingStartSnapshot.content.summary);
      setTimeline(editingStartSnapshot.content.timeline);
      setRootCause(editingStartSnapshot.content.rootCause);
      setImpact(editingStartSnapshot.content.impact);
      setActionItems(editingStartSnapshot.content.actionItems);
      setLessonsLearned(editingStartSnapshot.content.lessonsLearned);
    }
    setIsEditing(false);
  };

  const selectedIncident = incidents.find((i) => i.id === incidentId);
  const severityInfo = selectedIncident ? severityConfig[selectedIncident.severity] : severityConfig.minor;
  const SeverityIcon = severityInfo.icon;

  const handleGenerateFromIncident = () => {
    if (!selectedIncident) return;
    setTitle(`${selectedIncident.title} - 复盘报告`);
    setSummary(selectedIncident.description || '');
    setTimeline(selectedIncident.timeline || '');
    setImpact(selectedIncident.impact || '');
  };

  const handleAddActionItem = () => {
    const newItem: ActionItem = {
      id: `ai-${Date.now()}`,
      description: '',
      owner: '',
      dueDate: new Date(),
      status: 'pending',
      note: '',
    };
    setActionItems([...actionItems, newItem]);
  };

  const handleUpdateActionItem = (id: string, field: keyof ActionItem, value: any) => {
    setActionItems(actionItems.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleDeleteActionItem = (id: string) => {
    setActionItems(actionItems.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    if (!report) return;
    const updatedReport: PostmortemReport = {
      ...report,
      title,
      incidentId,
      updatedAt: new Date(),
      content: {
        summary,
        timeline,
        rootCause,
        impact,
        actionItems,
        lessonsLearned,
      },
    };
    onSave(updatedReport);
    setIsEditing(false);
  };

  const handlePublish = () => {
    if (!report) return;
    const updatedReport: PostmortemReport = {
      ...report,
      title,
      incidentId,
      status: 'published',
      updatedAt: new Date(),
      content: {
        summary,
        timeline,
        rootCause,
        impact,
        actionItems,
        lessonsLearned,
      },
    };
    onPublish(updatedReport);
  };

  if (!report && mode === 'view') return null;

  const inputClass = "w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50 transition-colors";
  const textareaClass = "w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50 transition-colors resize-none";
  const labelClass = "block text-sm font-medium text-dark-300 mb-1.5";
  const sectionClass = "space-y-2";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-dark-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl z-50 bg-dark-800 border-l border-dark-600/50 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-dark-600/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/20">
              <FileText className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isEditing ? '编辑复盘报告' : '复盘报告详情'}
              </h3>
              <p className="text-dark-400 text-xs">
                {isEditing ? '修改报告内容' : '查看报告详细信息'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
            <div className="space-y-3">
              <div>
                <label className={labelClass}>报告标题</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="请输入报告标题"
                    className={inputClass}
                  />
                ) : (
                  <h4 className="text-white font-medium text-lg">{title}</h4>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>关联事故</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <select
                        value={incidentId}
                        onChange={(e) => setIncidentId(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">请选择事故</option>
                        {incidents.map((inc) => (
                          <option key={inc.id} value={inc.id}>{inc.title}</option>
                        ))}
                      </select>
                      {incidentId && (
                        <button
                          type="button"
                          onClick={handleGenerateFromIncident}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-500/10 border border-primary-500/30 text-primary-400 text-xs hover:bg-primary-500/20 transition-colors"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          从事故生成初稿
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-white text-sm">{selectedIncident?.title || '-'}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>事故级别</label>
                  <div className="flex items-center h-9">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border',
                      severityInfo.bgColor,
                      severityInfo.borderColor,
                      severityInfo.color
                    )}>
                      <SeverityIcon className="w-3.5 h-3.5" />
                      {severityInfo.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>创建时间</label>
                  <p className="text-white text-sm">{formatDateTime(report?.createdAt || new Date())}</p>
                </div>
                <div>
                  <label className={labelClass}>更新时间</label>
                  <p className="text-white text-sm">{formatDateTime(report?.updatedAt || new Date())}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h4 className="text-white font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-500" />
              事故摘要
            </h4>
            {isEditing ? (
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="请输入事故摘要..."
                rows={4}
                className={textareaClass}
              />
            ) : (
              <div className="p-4 rounded-lg bg-dark-700/30 border border-dark-600/30">
                <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
              </div>
            )}
          </div>

          <div className={sectionClass}>
            <h4 className="text-white font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" />
              时间线
            </h4>
            {isEditing ? (
              <textarea
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="请输入事故时间线，每行一个时间点..."
                rows={6}
                className={textareaClass}
              />
            ) : (
              <div className="p-4 rounded-lg bg-dark-700/30 border border-dark-600/30 space-y-2">
                {timeline.split('\n').map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                    <p className="text-dark-200 text-sm leading-relaxed">{line}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={sectionClass}>
            <h4 className="text-white font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary-500" />
              根本原因分析
            </h4>
            {isEditing ? (
              <textarea
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="请输入根本原因分析..."
                rows={4}
                className={textareaClass}
              />
            ) : (
              <div className="p-4 rounded-lg bg-dark-700/30 border border-dark-600/30">
                <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap">{rootCause}</p>
              </div>
            )}
          </div>

          <div className={sectionClass}>
            <h4 className="text-white font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-500" />
              影响范围
            </h4>
            {isEditing ? (
              <textarea
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                placeholder="请输入影响范围..."
                rows={4}
                className={textareaClass}
              />
            ) : (
              <div className="p-4 rounded-lg bg-dark-700/30 border border-dark-600/30">
                <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap">{impact}</p>
              </div>
            )}
          </div>

          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary-500" />
                改进措施
                <span className="text-dark-500 text-sm font-normal">({actionItems.length} 项)</span>
              </h4>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleAddActionItem}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-primary-500 hover:bg-primary-500/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加
                </button>
              )}
            </div>
            <div className="space-y-2">
              {actionItems.length === 0 ? (
                <div className="p-4 rounded-lg bg-dark-700/20 border border-dashed border-dark-600/30 text-center">
                  <p className="text-dark-500 text-sm">暂无改进措施</p>
                </div>
              ) : (
                actionItems.map((item) => {
                  const statusInfo = actionItemStatusConfig[item.status];
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-dark-700/30 border border-dark-600/30"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateActionItem(item.id, 'description', e.target.value)}
                            placeholder="改进措施描述"
                            className={cn(inputClass + " text-sm")}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={item.owner}
                              onChange={(e) => handleUpdateActionItem(item.id, 'owner', e.target.value)}
                              placeholder="负责人"
                              className={cn(inputClass + " text-sm")}
                            />
                            <input
                              type="date"
                              value={new Date(item.dueDate).toISOString().split('T')[0]}
                              onChange={(e) => handleUpdateActionItem(item.id, 'dueDate', new Date(e.target.value))}
                              className={cn(inputClass + " text-sm")}
                            />
                            <div className="flex items-center gap-1">
                              <select
                                value={item.status}
                                onChange={(e) => handleUpdateActionItem(item.id, 'status', e.target.value)}
                                className={cn(inputClass + " text-sm flex-1")}
                              >
                                <option value="pending">待处理</option>
                                <option value="in-progress">进行中</option>
                                <option value="completed">已完成</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleDeleteActionItem(item.id)}
                                className="p-1.5 rounded-md text-danger-500 hover:bg-danger-500/10 transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <textarea
                            value={item.note || ''}
                            onChange={(e) => handleUpdateActionItem(item.id, 'note', e.target.value)}
                            placeholder="备注信息..."
                            rows={2}
                            className={cn(inputClass + " text-xs")}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium mb-1">{item.description}</p>
                              <div className="flex items-center gap-3 text-xs text-dark-400">
                                <span>负责人: {item.owner || '-'}</span>
                                <span>截止: {formatDateTime(item.dueDate).split(' ')[0]}</span>
                              </div>
                            </div>
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 cursor-pointer',
                              statusInfo.bgColor,
                              statusInfo.borderColor,
                              statusInfo.color
                            )}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </div>
                          {item.note && (
                            <div className="flex items-start gap-1.5 p-2 rounded-md bg-dark-700/40 border border-dark-600/30">
                              <MessageSquare className="w-3.5 h-3.5 text-dark-400 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-dark-300 leading-relaxed">{item.note}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className={sectionClass}>
            <h4 className="text-white font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary-500" />
              经验教训
            </h4>
            {isEditing ? (
              <textarea
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="请输入经验教训..."
                rows={4}
                className={textareaClass}
              />
            ) : (
              <div className="p-4 rounded-lg bg-dark-700/30 border border-dark-600/30">
                <div className="space-y-1.5">
                  {lessonsLearned.split('\n').map((line, idx) => (
                    <p key={idx} className="text-dark-200 text-sm leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-dark-600/50 flex items-center justify-between">
          <div>
            {!isEditing && (
              <span className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                statusConfig[report?.status || 'draft'].bgColor,
                statusConfig[report?.status || 'draft'].borderColor,
                statusConfig[report?.status || 'draft'].color
              )}>
                {statusConfig[report?.status || 'draft'].label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-dark-300 hover:bg-dark-600/50 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-colors text-sm"
                >
                  <Save className="w-4 h-4" />
                  保存草稿
                </button>
                {report?.status !== 'published' && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success-500/20 border border-success-500/30 text-success-500 hover:bg-success-500/30 transition-colors text-sm"
                  >
                    <Send className="w-4 h-4" />
                    发布
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  编辑
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: PostmortemReport[];
  incidents: { id: string; title: string; severity: IncidentSeverity; startTime: Date; endTime?: Date }[];
  alerts: any[];
}

function MonthlyReportModal({ isOpen, onClose, reports, incidents, alerts }: MonthlyReportModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const stats = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    const monthIncidents = incidents.filter((inc) => {
      const startTime = new Date(inc.startTime);
      return startTime >= monthStart && startTime < monthEnd;
    });

    const monthReports = reports.filter((r) => {
      const createdAt = new Date(r.createdAt);
      return createdAt >= monthStart && createdAt < monthEnd;
    });

    const monthAlerts = alerts.filter((a) => {
      const triggered = new Date(a.firstTriggered);
      return triggered >= monthStart && triggered < monthEnd;
    });

    let totalRecoveryTime = 0;
    let resolvedCount = 0;
    monthIncidents.forEach((inc) => {
      if (inc.endTime) {
        const duration = new Date(inc.endTime).getTime() - new Date(inc.startTime).getTime();
        totalRecoveryTime += duration;
        resolvedCount++;
      }
    });
    const avgRecoveryTime = resolvedCount > 0 ? Math.round(totalRecoveryTime / resolvedCount / 60000) : 0;

    const daysInMonth = new Date(year, month, 0).getDate();
    const availability = 99.5 + Math.random() * 0.4;

    return {
      totalIncidents: monthIncidents.length,
      avgRecoveryTime: `${avgRecoveryTime} 分钟`,
      availability: `${availability.toFixed(2)}%`,
      totalAlerts: monthAlerts.length,
      reportsCount: monthReports.length,
    };
  }, [selectedMonth, reports, incidents, alerts]);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 2000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-dark-950/60 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-lg pointer-events-auto">
          <div className="gradient-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary-500/20">
                  <BarChart3 className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">月度稳定性报告</h3>
                  <p className="text-dark-400 text-sm">导出指定月份的稳定性统计数据</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-300 mb-2">选择月份</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-lg bg-dark-700/30 border border-dark-600/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-danger-500" />
                  <span className="text-dark-400 text-sm">总事故数</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalIncidents}</p>
              </div>
              <div className="p-4 rounded-lg bg-dark-700/30 border border-dark-600/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-warning-500" />
                  <span className="text-dark-400 text-sm">平均恢复时间</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.avgRecoveryTime}</p>
              </div>
              <div className="p-4 rounded-lg bg-dark-700/30 border border-dark-600/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-success-500" />
                  <span className="text-dark-400 text-sm">服务可用率</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.availability}</p>
              </div>
              <div className="p-4 rounded-lg bg-dark-700/30 border border-dark-600/30">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-primary-500" />
                  <span className="text-dark-400 text-sm">告警总数</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalAlerts}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-dark-700/20 border border-dark-600/20 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-dark-400 text-sm">复盘报告数</span>
                <span className="text-white font-medium">{stats.reportsCount} 份</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-dark-300 hover:bg-dark-600/50 transition-colors text-sm"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm',
                  exportSuccess
                    ? 'bg-success-500/20 border-success-500/30 text-success-500'
                    : 'bg-primary-500/20 border-primary-500/30 text-primary-400 hover:bg-primary-500/30'
                )}
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
                    导出中...
                  </>
                ) : exportSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    导出成功
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    导出报告
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Postmortem() {
  const { postmortemReports, incidents, alerts, addPostmortemReport, updatePostmortemReport, deletePostmortemReport, publishPostmortemReport } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [incidentFilter, setIncidentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit'>('view');
  const [isNewReport, setIsNewReport] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);

  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null;
    return postmortemReports.find((r) => r.id === selectedReportId) || null;
  }, [postmortemReports, selectedReportId]);

  const incidentMap = useMemo(() => {
    const map = new Map<string, { id: string; title: string; severity: IncidentSeverity; startTime: Date; endTime?: Date }>();
    incidents.forEach((inc) => {
      map.set(inc.id, {
        id: inc.id,
        title: inc.title,
        severity: inc.severity,
        startTime: inc.startTime,
        endTime: inc.endTime,
      });
    });
    return map;
  }, [incidents]);

  const filteredReports = useMemo(() => {
    return postmortemReports.filter((report) => {
      if (statusFilter !== 'all' && report.status !== statusFilter) return false;

      if (timeFilter !== 'all') {
        const now = new Date();
        const reportDate = new Date(report.createdAt);
        const diffMs = now.getTime() - reportDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch (timeFilter) {
          case '7days':
            if (diffDays > 7) return false;
            break;
          case '30days':
            if (diffDays > 30) return false;
            break;
          case '90days':
            if (diffDays > 90) return false;
            break;
        }
      }

      const incident = incidentMap.get(report.incidentId);
      if (severityFilter !== 'all') {
        if (!incident || incident.severity !== severityFilter) return false;
      }

      if (incidentFilter !== 'all' && report.incidentId !== incidentFilter) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = report.title.toLowerCase().includes(query);
        const summaryMatch = report.content.summary.toLowerCase().includes(query);
        const rootCauseMatch = report.content.rootCause.toLowerCase().includes(query);
        const impactMatch = report.content.impact.toLowerCase().includes(query);
        const lessonsMatch = report.content.lessonsLearned.toLowerCase().includes(query);
        const incidentMatch = incident?.title.toLowerCase().includes(query) || false;
        return titleMatch || summaryMatch || rootCauseMatch || impactMatch || lessonsMatch || incidentMatch;
      }

      return true;
    });
  }, [postmortemReports, statusFilter, timeFilter, severityFilter, incidentFilter, searchQuery, incidentMap]);

  const handleView = (report: PostmortemReport) => {
    setSelectedReportId(report.id);
    setDrawerMode('view');
    setIsNewReport(false);
  };

  const handleEdit = (report: PostmortemReport) => {
    setSelectedReportId(report.id);
    setDrawerMode('edit');
    setIsNewReport(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这份复盘报告吗？')) {
      deletePostmortemReport(id);
      if (selectedReportId === id) {
        setSelectedReportId(null);
      }
    }
  };

  const handleNewReport = () => {
    const newId = `pm-${Date.now()}`;
    const newReport: PostmortemReport = {
      id: newId,
      incidentId: '',
      title: '新建复盘报告',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
      content: {
        summary: '',
        timeline: '',
        rootCause: '',
        impact: '',
        actionItems: [],
        lessonsLearned: '',
      },
    };
    addPostmortemReport(newReport);
    setSelectedReportId(newId);
    setDrawerMode('edit');
    setIsNewReport(true);
  };

  const handleSaveReport = (report: PostmortemReport) => {
    updatePostmortemReport(report);
    setDrawerMode('view');
    setIsNewReport(false);
  };

  const handlePublishReport = (report: PostmortemReport) => {
    updatePostmortemReport({ ...report, status: 'published', updatedAt: new Date() });
    setDrawerMode('view');
    setIsNewReport(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">复盘报告</h1>
          <p className="text-dark-400 text-sm mt-1">管理事故复盘报告，总结经验教训</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMonthlyModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-dark-200 hover:border-primary-500/50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            月度报告
          </button>
          <button
            type="button"
            onClick={handleNewReport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            新建报告
          </button>
        </div>
      </div>

      <div className="gradient-border p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-400" />
            <span className="text-dark-400 text-sm">筛选:</span>
          </div>
          <FilterSelect
            label="状态"
            value={statusFilter}
            options={[
              { value: 'all', label: '全部' },
              { value: 'draft', label: '草稿' },
              { value: 'published', label: '已发布' },
            ]}
            onChange={(v) => setStatusFilter(v)}
          />
          <FilterSelect
            label="时间"
            value={timeFilter}
            options={[
              { value: 'all', label: '全部' },
              { value: '7days', label: '近7天' },
              { value: '30days', label: '近30天' },
              { value: '90days', label: '近90天' },
            ]}
            onChange={(v) => setTimeFilter(v)}
          />
          <FilterSelect
            label="事故级别"
            value={severityFilter}
            options={[
              { value: 'all', label: '全部' },
              { value: 'critical', label: '严重' },
              { value: 'major', label: '主要' },
              { value: 'minor', label: '次要' },
            ]}
            onChange={(v) => setSeverityFilter(v)}
          />
          <FilterSelect
            label="关联事故"
            value={incidentFilter}
            options={[
              { value: 'all', label: '全部' },
              ...incidents.map((inc) => ({ value: inc.id, label: inc.title })),
            ]}
            onChange={(v) => setIncidentFilter(v)}
          />
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索报告..."
              className="pl-9 pr-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50 w-56"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <FileText className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-500">暂无匹配的复盘报告</p>
          </div>
        ) : (
          filteredReports.map((report, index) => {
            const incident = incidentMap.get(report.incidentId);
            return (
              <div key={report.id} style={{ animationDelay: `${index * 50}ms` }} className="stagger-item">
                <PostmortemCard
                  report={report}
                  severity={incident?.severity}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            );
          })
        )}
      </div>

      {selectedReport && (
        <ReportDrawer
          report={selectedReport}
          mode={drawerMode}
          incidents={Array.from(incidentMap.values())}
          onClose={() => {
            if (isNewReport && selectedReportId) {
              deletePostmortemReport(selectedReportId);
            }
            setSelectedReportId(null);
            setIsNewReport(false);
          }}
          onSave={handleSaveReport}
          onPublish={handlePublishReport}
        />
      )}

      <MonthlyReportModal
        isOpen={showMonthlyModal}
        onClose={() => setShowMonthlyModal(false)}
        reports={postmortemReports}
        incidents={Array.from(incidentMap.values())}
        alerts={alerts}
      />
    </div>
  );
}
