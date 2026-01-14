interface TotalInstitutionsProps {
  count: number
}

export function TotalInstitutions({ count }: TotalInstitutionsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        Connected Institutions
      </p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{count}</p>
    </div>
  )
}
