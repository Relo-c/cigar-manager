<script setup lang="ts">
import { computed, ref } from 'vue'
import { brandSearchText, habanosBrands, standardBrandName } from '../services/brandLogos'
import { useInventoryStore } from '../stores/inventory'

const model = defineModel<string>({ required: true })
const inventory = useInventoryStore()
const focused = ref(false)

const normalizedQuery = computed(() => model.value.trim().toLocaleLowerCase())
const knownSuggestions = computed(() => {
  const query = normalizedQuery.value
  return habanosBrands.filter((brand) => !query || brandSearchText(brand).includes(query)).slice(0, 8)
})
const inventorySuggestions = computed(() => {
  const query = normalizedQuery.value
  const knownNames = new Set(knownSuggestions.value.map((brand) => brand.name))
  return [...new Set([...inventory.boxes, ...inventory.looseStocks].map((item) => item.brand.trim()))]
    .map((name) => standardBrandName(name) ?? name)
    .filter((name, index, names) => name && names.indexOf(name) === index && !knownNames.has(name) && (!query || name.toLocaleLowerCase().includes(query)))
    .slice(0, Math.max(0, 8 - knownSuggestions.value.length))
})
const showSuggestions = computed(() => focused.value && (knownSuggestions.value.length > 0 || inventorySuggestions.value.length > 0))

function select(name: string): void {
  model.value = name
  focused.value = false
}

function finish(): void {
  const standard = standardBrandName(model.value)
  if (standard) model.value = standard
  window.setTimeout(() => { focused.value = false }, 120)
}
</script>

<template>
  <div class="brand-autocomplete">
    <van-field v-model="model" label="品牌" placeholder="输入中文或英文品牌" required autocomplete="off" @focus="focused = true" @blur="finish" />
    <div v-if="showSuggestions" class="brand-autocomplete__menu">
      <button v-for="brand in knownSuggestions" :key="brand.english" type="button" @mousedown.prevent="select(brand.name)">
        <span>{{ brand.name }}</span><small>{{ brand.english }}</small>
      </button>
      <button v-for="name in inventorySuggestions" :key="name" type="button" @mousedown.prevent="select(name)">
        <span>{{ name }}</span><small>库存品牌</small>
      </button>
    </div>
  </div>
</template>
