<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import BrandField from './BrandField.vue'
import HistoryField from './HistoryField.vue'
import type { LooseInput } from '../services/inventory'
import { standardBrandName } from '../services/brandLogos'
import { useInventoryStore } from '../stores/inventory'
import type { LooseInventory } from '../types/inventory'

const props = defineProps<{ modelValue?: LooseInventory }>()
const emit = defineEmits<{ save: [value: LooseInput] }>()
const inventory = useInventoryStore()
const form = reactive({ brand: '', model: '', year: '', quantity: '', cabinet: '', customStickPrice: '', stockedAt: '' })

watch(() => props.modelValue, (stock) => {
  Object.assign(form, stock ? {
    brand: stock.brand, model: stock.model, year: String(stock.year), quantity: String(stock.quantity),
    cabinet: stock.cabinet, customStickPrice: String(stock.customStickPrice), stockedAt: stock.stockedAt.slice(0, 16)
  } : { brand: '', model: '', year: '', quantity: '', cabinet: '', customStickPrice: '', stockedAt: new Date().toISOString().slice(0, 16) })
}, { immediate: true })

const valid = computed(() => form.brand.trim() && form.model.trim() && Number(form.year) > 0 && Number(form.quantity) > 0 && form.cabinet.trim() && Number(form.customStickPrice) >= 0 && form.stockedAt)

const brandKey = (value: string) => (standardBrandName(value) ?? value).trim().toLocaleLowerCase()
const allBrandRecords = computed(() => [...inventory.boxes, ...inventory.looseStocks]
  .filter((item) => brandKey(item.brand) === brandKey(form.brand))
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
const looseHistory = computed(() => inventory.looseStocks
  .filter((item) => brandKey(item.brand) === brandKey(form.brand) && (!form.model.trim() || item.model.toLocaleLowerCase() === form.model.trim().toLocaleLowerCase()))
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
const values = (key: keyof LooseInventory) => computed(() => looseHistory.value.map((item) => item[key]).filter((value) => value !== undefined && value !== '').map(String))
const modelSuggestions = computed(() => allBrandRecords.value.map((item) => item.model))
const years = values('year')
const quantities = values('quantity')
const cabinets = values('cabinet')
const stickPrices = values('customStickPrice')

function selectModel(model: string): void {
  const normalized = model.trim().toLocaleLowerCase()
  const latestLoose = inventory.looseStocks
    .filter((item) => brandKey(item.brand) === brandKey(form.brand) && item.model.trim().toLocaleLowerCase() === normalized)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const latestAny = allBrandRecords.value.find((item) => item.model.trim().toLocaleLowerCase() === normalized)
  if (latestAny) {
    form.year = String(latestAny.year)
    form.cabinet = latestAny.cabinet
  }
  if (latestLoose) Object.assign(form, {
    year: String(latestLoose.year), quantity: String(latestLoose.quantity), cabinet: latestLoose.cabinet,
    customStickPrice: String(latestLoose.customStickPrice)
  })
}

function submit(): void {
  if (!valid.value) return
  emit('save', { brand: form.brand.trim(), model: form.model.trim(), year: Number(form.year), quantity: Number(form.quantity), cabinet: form.cabinet.trim(), customStickPrice: Number(form.customStickPrice), stockedAt: new Date(form.stockedAt).toISOString() })
}
</script>

<template>
  <van-form class="stock-form" @submit="submit">
    <BrandField v-model="form.brand" />
    <HistoryField v-model="form.model" label="型号" placeholder="输入或选择历史型号" :suggestions="modelSuggestions" required @select="selectModel" />
    <HistoryField v-model="form.year" type="digit" label="年份" placeholder="例如 2024" :suggestions="years" required maxlength="4" />
    <HistoryField v-model="form.quantity" type="digit" label="支数" :suggestions="quantities" required />
    <HistoryField v-model="form.cabinet" label="柜号" placeholder="必填" :suggestions="cabinets" required />
    <HistoryField v-model="form.customStickPrice" type="number" label="每支价格" :suggestions="stickPrices" required />
    <van-field v-model="form.stockedAt" type="datetime-local" label="入库时间" required />
    <div class="form-actions"><van-button native-type="submit" type="primary" block round :disabled="!valid">保存</van-button></div>
  </van-form>
</template>
