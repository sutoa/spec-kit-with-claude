import type { AccountBalance } from '../../hooks/useDashboard'

interface AccountRowProps {
  account: AccountBalance
}

export function AccountRow({ account }: AccountRowProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{account.accountName}</p>
        <p className="text-xs text-gray-500">{account.accountNumberMasked}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">
          {formatCurrency(account.totalValue)}
        </p>
        <p className="text-xs text-gray-500">as of {formatDate(account.asOfDate)}</p>
      </div>
    </div>
  )
}
