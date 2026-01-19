interface Institution {
  id: string
  name: string
}

interface InstitutionFilterProps {
  institutions: Institution[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  showAllOption?: boolean
}

export function InstitutionFilter({
  institutions,
  selectedIds,
  onChange,
  showAllOption = false,
}: InstitutionFilterProps) {
  const allSelected = institutions.length > 0 && selectedIds.length === institutions.length
  const noneSelected = selectedIds.length === 0

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const handleToggleAll = () => {
    if (allSelected) {
      onChange([])
    } else {
      onChange(institutions.map((inst) => inst.id))
    }
  }

  if (institutions.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <label className="block text-text-secondary-dark text-sm font-medium mb-2">
        Filter by Institution
      </label>

      {showAllOption && (
        <label className="flex items-center gap-2 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleToggleAll}
            className="w-4 h-4 rounded border-border-dark bg-input-bg-dark text-primary focus:ring-primary focus:ring-offset-0"
            aria-label="All Institutions"
          />
          <span className="text-text-primary-dark text-sm font-medium">
            All Institutions
          </span>
        </label>
      )}

      {showAllOption && <div className="border-t border-border-dark my-2" />}

      <div className="space-y-1">
        {institutions.map((institution) => (
          <label
            key={institution.id}
            className="flex items-center gap-2 cursor-pointer py-1 hover:bg-input-bg-dark/50 rounded px-1 -mx-1"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(institution.id)}
              onChange={() => handleToggle(institution.id)}
              className="w-4 h-4 rounded border-border-dark bg-input-bg-dark text-primary focus:ring-primary focus:ring-offset-0"
              aria-label={institution.name}
            />
            <span className="text-text-primary-dark text-sm">
              {institution.name}
            </span>
          </label>
        ))}
      </div>

      {!noneSelected && selectedIds.length < institutions.length && (
        <p className="text-text-secondary-dark text-xs mt-2">
          Showing {selectedIds.length} of {institutions.length} institutions
        </p>
      )}
    </div>
  )
}
