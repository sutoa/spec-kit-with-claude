interface GrandTotalProps {
  total: number
  asOfDate: string | null
}

export function GrandTotal({ total, asOfDate }: GrandTotalProps) {
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            Grand Total
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatCurrency(total)}
          </p>
        </div>
        {asOfDate && (
          <div className="text-right">
            <p className="text-xs text-gray-500">As of</p>
            <p className="text-sm font-medium text-gray-700">{formatDate(asOfDate)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
