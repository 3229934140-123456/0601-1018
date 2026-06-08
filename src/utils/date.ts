export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function isToday(date: Date | string | number): boolean {
  const d = new Date(date)
  const today = new Date()
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

export function startOfDay(date: Date | string | number): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date | string | number, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}
