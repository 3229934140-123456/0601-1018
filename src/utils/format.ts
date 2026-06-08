export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}

export function formatPercent(num: number): string {
  return `${num.toFixed(2)}%`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`
  }

  return `${seconds}秒`
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date().getTime()
  const target = new Date(date).getTime()
  const diffMs = now - target
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000)
  const isPast = diffMs > 0

  if (diffSeconds < 60) {
    return isPast ? '刚刚' : '即将'
  }

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) {
    return isPast ? `${diffMinutes}分钟前` : `${diffMinutes}分钟后`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return isPast ? `${diffHours}小时前` : `${diffHours}小时后`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) {
    return isPast ? `${diffDays}天前` : `${diffDays}天后`
  }

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) {
    return isPast ? `${diffMonths}个月前` : `${diffMonths}个月后`
  }

  const diffYears = Math.floor(diffMonths / 12)
  return isPast ? `${diffYears}年前` : `${diffYears}年后`
}
