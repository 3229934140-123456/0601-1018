import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Network,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { path: '/', label: '总览大盘', icon: LayoutDashboard },
  { path: '/topology', label: '服务拓扑', icon: Network },
  { path: '/alerts', label: '告警列表', icon: AlertTriangle },
  { path: '/metrics', label: '指标趋势', icon: TrendingUp },
  { path: '/duty', label: '值班日历', icon: Calendar },
  { path: '/timeline', label: '事件时间线', icon: Clock },
  { path: '/postmortem', label: '复盘报告', icon: FileText },
  { path: '/settings', label: '规则设置', icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r border-primary-500/10 bg-dark-900/95 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-primary-500/10 px-4">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 shadow-glow-primary">
            <Activity className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white text-glow">
              SRE Monitor
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      collapsed && 'justify-center',
                      isActive
                        ? 'bg-primary-500/20 text-primary-400 shadow-glow-primary'
                        : 'text-dark-300 hover:bg-dark-800 hover:text-primary-400'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-all duration-200',
                          isActive && 'drop-shadow-[0_0_8px_rgba(0,212,255,0.6)]'
                        )}
                      />
                      {!collapsed && (
                        <span
                          className={cn(
                            'transition-all duration-200',
                            isActive && 'text-glow'
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-primary-500/10 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-dark-300 transition-colors hover:bg-dark-800 hover:text-primary-400"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">收起菜单</span>
            </>
          )}
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
      </div>
    </aside>
  )
}
