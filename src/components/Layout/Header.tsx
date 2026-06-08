import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Search,
  Bell,
  User,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const titleMap: Record<string, string> = {
  '/': '总览大盘',
  '/topology': '服务拓扑',
  '/alerts': '告警列表',
  '/metrics': '指标趋势',
  '/duty': '值班日历',
  '/timeline': '事件时间线',
  '/postmortem': '复盘报告',
  '/settings': '规则设置',
}

export default function Header() {
  const location = useLocation()
  const [searchFocused, setSearchFocused] = useState(false)
  const unreadCount = 12

  const getPageTitle = () => {
    return titleMap[location.pathname] || '总览大盘'
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-primary-500/10 bg-dark-900/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-white">
          {getPageTitle()}
        </h1>
        <div className="h-6 w-px bg-primary-500/20" />
        <div className="text-sm text-dark-300">
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={cn(
            'relative flex items-center rounded-lg border transition-all duration-200',
            searchFocused
              ? 'border-primary-500/50 bg-dark-800/80 shadow-glow-primary'
              : 'border-dark-700 bg-dark-800/40'
          )}
        >
          <Search
            className={cn(
              'absolute left-3 h-4 w-4 transition-colors',
              searchFocused ? 'text-primary-400' : 'text-dark-400'
            )}
          />
          <input
            type="text"
            placeholder="搜索服务、告警、指标..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-64 bg-transparent py-2 pl-10 pr-4 text-sm text-dark-100 placeholder-dark-500 focus:outline-none"
          />
        </div>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-dark-700 bg-dark-800/40 text-dark-300 transition-all hover:border-primary-500/30 hover:text-primary-400 hover:shadow-glow-primary">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 text-xs font-medium text-white shadow-glow-danger">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-dark-700" />

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shadow-glow-primary">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="hidden flex-col text-left sm:flex">
            <span className="text-sm font-medium text-white">运维工程师</span>
            <span className="text-xs text-dark-400">admin@sre.io</span>
          </div>
          <ChevronDown className="h-4 w-4 text-dark-400" />
        </div>
      </div>
    </header>
  )
}
