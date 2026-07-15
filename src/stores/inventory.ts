import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { db } from '../db/database'
import type { BoxInventory, LooseInventory } from '../types/inventory'

export const useInventoryStore = defineStore('inventory', () => {
  const boxes = ref<BoxInventory[]>([])
  const looseStocks = ref<LooseInventory[]>([])
  const loading = ref(false)

  const boxCount = computed(() => boxes.value.length)
  const boxedStickCount = computed(() =>
    boxes.value.reduce((sum, box) => sum + box.sticksPerBox, 0)
  )
  const looseStickCount = computed(() =>
    looseStocks.value.reduce((sum, stock) => sum + stock.quantity, 0)
  )
  const totalValue = computed(
    () =>
      boxes.value.reduce((sum, box) => sum + box.customBoxPrice, 0) +
      looseStocks.value.reduce(
        (sum, stock) => sum + stock.customStickPrice * stock.quantity,
        0
      )
  )

  async function load(): Promise<void> {
    loading.value = true
    try {
      ;[boxes.value, looseStocks.value] = await Promise.all([
        db.boxes.toArray(),
        db.looseStocks.toArray()
      ])
    } finally {
      loading.value = false
    }
  }

  return {
    boxes,
    looseStocks,
    loading,
    boxCount,
    boxedStickCount,
    looseStickCount,
    totalValue,
    load
  }
})
