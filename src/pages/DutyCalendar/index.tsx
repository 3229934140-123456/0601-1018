import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sun,
  Moon,
  Sunrise,
  Phone,
  Mail,
  User,
  Clock,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { isToday } from '@/utils/date';
import type { DutyShift, DutyRecord } from '@/types';

const shiftLabels: Record<DutyShift, string> = {
  morning: '早班',
  afternoon: '中班',
  night: '晚班',
};

const shiftIcons: Record<DutyShift, typeof Sun> = {
  morning: Sunrise,
  afternoon: Sun,
  night: Moon,
};

const shiftColors: Record<DutyShift, string> = {
  morning: 'text-warning-500',
  afternoon: 'text-primary-400',
  night: 'text-dark-300',
};

const shiftBgColors: Record<DutyShift, string> = {
  morning: 'bg-warning-500/20',
  afternoon: 'bg-primary-500/20',
  night: 'bg-dark-700/50',
};

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function DutyCalendar() {
  const { dutyRecords, dutyPersons } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [year, month]);

  const dutyRecordsByDate = useMemo(() => {
    const map: Record<string, Record<DutyShift, DutyRecord | undefined>> = {};
    dutyRecords.forEach((record) => {
      if (!map[record.date]) {
        map[record.date] = { morning: undefined, afternoon: undefined, night: undefined };
      }
      map[record.date][record.shift] = record;
    });
    return map;
  }, [dutyRecords]);

  const personDutyCount = useMemo(() => {
    const count: Record<string, number> = {};
    const monthStart = new Date(year, month, 1).toISOString().split('T')[0];
    const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];

    dutyRecords.forEach((record) => {
      if (record.date >= monthStart && record.date <= monthEnd) {
        count[record.person.id] = (count[record.person.id] || 0) + 1;
      }
    });
    return count;
  }, [dutyRecords, year, month]);

  const selectedDateRecords = useMemo(() => {
    if (!selectedDate) return null;
    return dutyRecordsByDate[selectedDate] || null;
  }, [selectedDate, dutyRecordsByDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
  };

  const formatDateStr = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isWeekend = (dayIndex: number) => {
    return dayIndex === 0 || dayIndex === 6;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div className="gradient-border p-5">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary-400" />
                <h2 className="text-lg font-semibold text-white">值班日历</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-dark-800/50 text-dark-300 transition-colors hover:bg-dark-700/50 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[120px text-center text-base font-medium text-white">
                  {year}年{month + 1}月
                </span>
                <button
                  onClick={handleNextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-dark-800/50 text-dark-300 transition-colors hover:bg-dark-700/50 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="ml-2 rounded-lg bg-primary-500/20 px-3 py-1.5 text-xs font-medium text-primary-400 transition-colors hover:bg-primary-500/30"
                >
                  今天
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={`py-2 text-center text-xs font-medium ${
                    isWeekend(index) ? 'text-danger-400' : 'text-dark-300'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const dayIndex = index % 7;
                const weekend = isWeekend(dayIndex);
                const dateStr = date ? formatDateStr(date) : '';
                const today = date ? isToday(date) : false;
                const selected = dateStr === selectedDate;
                const dayRecords = date ? dutyRecordsByDate[dateStr] : null;

                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleDateClick(date)}
                    className={`
                      relative cursor-pointer rounded-lg p-2 transition-all duration-200
                      ${selected
                        ? 'bg-primary-500/20 ring-2 ring-primary-500/50'
                        : 'bg-dark-800/30 hover:bg-dark-800/60'
                      }
                      ${today ? 'ring-2 ring-primary-400/60' : ''}
                    `}
                  >
                    <div
                      className={`
                        text-sm font-medium
                      ${today ? 'text-primary-400' : weekend ? 'text-danger-400' : 'text-white'}
                    `}
                    >
                      {date.getDate()}
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {(['morning', 'afternoon', 'night'] as DutyShift[]).map((shift) => (
                        <div key={shift} className="flex items-center justify-between">
                          {dayRecords?.[shift] ? (
                            <>
                              <div className={`text-[10px] ${shiftColors[shift]}`}>
                                {shiftLabels[shift]}
                              </div>
                              <img
                                src={dayRecords[shift]!.person.avatar}
                                alt={dayRecords[shift]!.person.name}
                                className="h-4 w-4 rounded-full border border-dark-700"
                              />
                            </>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="gradient-border p-5">
            <div className="mb-4 flex items-center gap-3">
              <User className="h-5 w-5 text-primary-400" />
              <h3 className="text-base font-semibold text-white">值班人员</h3>
              <span className="text-xs text-dark-400">本月值班统计</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dutyPersons.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 rounded-lg bg-dark-800/30 p-3 transition-colors hover:bg-dark-800/50"
                >
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="h-10 w-10 rounded-full border-2 border-primary-500/30"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{person.name}</p>
                    <p className="truncate text-xs text-dark-400">{person.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-400">
                      {personDutyCount[person.id] || 0}
                    </p>
                    <p className="text-xs text-dark-400">次</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80">
          <div className="gradient-border p-5 lg:sticky lg:top-4">
            <div className="mb-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary-400" />
              <h3 className="text-base font-semibold text-white">值班详情</h3>
            </div>

            {selectedDateRecords ? (
              <div className="space-y-4">
              <div className="rounded-lg bg-dark-800/30 p-3">
                <p className="text-sm font-medium text-white">{selectedDate}</p>
                <p className="mt-1 text-xs text-dark-400">
                  {new Date(selectedDate!).toLocaleDateString('zh-CN', {
                    weekday: 'long',
                  })}
                </p>
              </div>

              {(['morning', 'afternoon', 'night'] as DutyShift[]).map((shift) => {
                const record = selectedDateRecords[shift];
                const ShiftIcon = shiftIcons[shift];

                return (
                  <div
                    key={shift}
                    className="rounded-lg bg-dark-800/30 p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-md ${shiftBgColors[shift]}`}>
                        <ShiftIcon className={`h-3.5 w-3.5 ${shiftColors[shift]}`} />
                      </div>
                      <span className={`text-sm font-medium ${shiftColors[shift]}`}>
                        {shiftLabels[shift]}
                      </span>
                    </div>

                    {record ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={record.person.avatar}
                            alt={record.person.name}
                            className="h-12 w-12 rounded-full border-2 border-primary-500/30"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{record.person.name}</p>
                            <p className="text-xs text-dark-400">值班人员</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Phone className="h-3 w-3 text-dark-400" />
                            <span className="text-dark-300">{record.person.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Mail className="h-3 w-3 text-dark-400" />
                            <span className="text-dark-300 truncate">{record.person.email}</span>
                          </div>
                        </div>

                        {record.handover && (
                          <div className="rounded-md bg-dark-900/50 p-2">
                            <div className="mb-1 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-dark-400" />
                              <span className="text-xs font-medium text-dark-300">交接班备注</span>
                            </div>
                            <p className="text-xs text-dark-200">{record.handover}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-sm text-dark-400">
                        暂无值班安排
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            ) : (
              <div className="py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-dark-500" />
                <p className="mt-3 text-sm text-dark-400">点击日期查看值班详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
