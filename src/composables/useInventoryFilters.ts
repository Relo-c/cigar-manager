import { computed, ref, type ComputedRef, type Ref } from 'vue'

interface FilterableInventory {
  brand: string
  model: string
  year: number
  cabinet: string
}

interface InventoryFilters<T> {
  query: Ref<string>
  brandFilter: Ref<string>
  cabinetFilter: Ref<string>
  brands: ComputedRef<string[]>
  cabinets: ComputedRef<string[]>
  filtered: ComputedRef<T[]>
  filteredStickCount: ComputedRef<number>
  filteredValue: ComputedRef<number>
}

export function useInventoryFilters<T extends FilterableInventory>(
  items: () => T[],
  stickCount: (item: T) => number,
  inventoryValue: (item: T) => number
): InventoryFilters<T> {
  const query = ref('')
  const brandFilter = ref('')
  const cabinetFilter = ref('')

  const brands = computed(() =>
    [...new Set(items().map((item) => item.brand))].sort((a, b) =>
      a.localeCompare(b, 'zh-CN')
    )
  )
  const cabinets = computed(() =>
    [...new Set(items().map((item) => item.cabinet))].sort((a, b) =>
      a.localeCompare(b, 'zh-CN', { numeric: true })
    )
  )
  const filtered = computed(() => {
    const normalizedQuery = query.value.trim().toLowerCase()
    return items().filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [item.brand, item.model, item.year, item.cabinet].some((value) =>
          String(value).toLowerCase().includes(normalizedQuery)
        )
      const matchesBrand = !brandFilter.value || item.brand === brandFilter.value
      const matchesCabinet =
        !cabinetFilter.value || item.cabinet === cabinetFilter.value
      return matchesQuery && matchesBrand && matchesCabinet
    })
  })
  const filteredStickCount = computed(() =>
    filtered.value.reduce((sum, item) => sum + stickCount(item), 0)
  )
  const filteredValue = computed(() =>
    filtered.value.reduce((sum, item) => sum + inventoryValue(item), 0)
  )

  return {
    query,
    brandFilter,
    cabinetFilter,
    brands,
    cabinets,
    filtered,
    filteredStickCount,
    filteredValue
  }
}
