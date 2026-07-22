export function formatAgingDuration(
  stockedAt: string,
  referenceDate = new Date()
): string {
  const startDate = new Date(stockedAt)
  if (Number.isNaN(startDate.getTime()) || startDate >= referenceDate) {
    return '已淳化 不足1个月'
  }

  let totalMonths =
    (referenceDate.getFullYear() - startDate.getFullYear()) * 12 +
    referenceDate.getMonth() -
    startDate.getMonth()

  if (referenceDate.getDate() < startDate.getDate()) {
    totalMonths -= 1
  }
  totalMonths = Math.max(0, totalMonths)

  if (totalMonths === 0) return '已淳化 不足1个月'

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (years === 0) return `已淳化 ${months}个月`
  if (months === 0) return `已淳化 ${years}年`
  return `已淳化 ${years}年${months}个月`
}
