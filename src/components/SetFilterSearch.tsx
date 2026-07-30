import { useEffect, useMemo, useRef, useState } from 'react'

export type SetFilterOption = {
  name: string
  count?: number
}

type SetFilterSearchProps = {
  options: SetFilterOption[]
  query: string
  selectedValue: string
  onQueryChange: (value: string) => void
  onSelect: (value: string) => void
}

function SetFilterSearch({
  options,
  query,
  selectedValue,
  onQueryChange,
  onSelect,
}: SetFilterSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current) {
        return
      }
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [])

  const visibleOptions = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) {
      return options
    }
    return options.filter((option) => option.name.toLowerCase().includes(search))
  }, [options, query])

  function handlePick(optionValue: string) {
    onSelect(optionValue)
    onQueryChange(optionValue)
    setIsOpen(false)
  }

  function clearFilter() {
    onSelect('')
    onQueryChange('')
    setIsOpen(false)
  }

  return (
    <div className="filter-search" ref={rootRef}>
      <input
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Buscar set y seleccionar..."
        aria-label="Buscar set"
      />

      {isOpen && (
        <div className="filter-search-dropdown" role="listbox" aria-label="Opciones de set">
          <button
            type="button"
            className={selectedValue === '' ? 'filter-option active' : 'filter-option'}
            onClick={clearFilter}
          >
            Todos los sets
          </button>

          {visibleOptions.length === 0 && <p className="filter-empty">Sin coincidencias</p>}

          {visibleOptions.map((option) => (
            <button
              key={option.name}
              type="button"
              className={selectedValue === option.name ? 'filter-option active' : 'filter-option'}
              onClick={() => handlePick(option.name)}
            >
              {option.name}
              {typeof option.count === 'number' ? ` (${option.count})` : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SetFilterSearch
