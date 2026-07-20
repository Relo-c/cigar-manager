<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import BrandField from './BrandField.vue'
import HistoryField from './HistoryField.vue'
import type { BoxInput } from '../services/inventory'
import { standardBrandName } from '../services/brandLogos'
import { useInventoryStore } from '../stores/inventory'
import type { BoxInventory } from '../types/inventory'

const props = defineProps<{ modelValue?: BoxInventory }>()
const emit = defineEmits<{ save: [value: BoxInput] }>()
const inventory = useInventoryStore()

const form = reactive({
  brand: '', model: '', year: '', sticksPerBox: '', cabinet: '', customBoxPrice: '',
  serialNumber: '', source: '', ringGauge: '', lengthMm: '', stockedAt: ''
})

watch(
  () => props.modelValue,
  (box) => {
    Object.assign(form, box ? {
      brand: box.brand, model: box.model, year: String(box.year),
      sticksPerBox: String(box.sticksPerBox), cabinet: box.cabinet,
      customBoxPrice: String(box.customBoxPrice), serialNumber: box.serialNumber ?? '',
      source: box.source ?? '', ringGauge: box.ringGauge ? String(box.ringGauge) : '',
      lengthMm: box.lengthMm ? String(box.lengthMm) : '',
      stockedAt: box.stockedAt.slice(0, 16)
    } : { brand: '', model: '', year: '', sticksPerBox: '', cabinet: '', customBoxPrice: '', serialNumber: '', source: '', ringGauge: '', lengthMm: '', stockedAt: new Date().toISOString().slice(0, 16) })
  },
  { immediate: true }
)

const valid = computed(() => form.brand.trim() && form.model.trim() && Number(form.year) > 0 && Number(form.sticksPerBox) > 0 && form.cabinet.trim() && Number(form.customBoxPrice) >= 0 && form.stockedAt)

const brandKey = (value: string) => (standardBrandName(value) ?? value).trim().toLocaleLowerCase()
const allBrandRecords = computed(() => [...inventory.boxes, ...inventory.looseStocks]
  .filter((item) => brandKey(item.brand) === brandKey(form.brand))
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
const boxHistory = computed(() => inventory.boxes
  .filter((item) => brandKey(item.brand) === brandKey(form.brand) && (!form.model.trim() || item.model.toLocaleLowerCase() === form.model.trim().toLocaleLowerCase()))
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
const values = (key: keyof BoxInventory) => computed(() => boxHistory.value.map((item) => item[key]).filter((value) => value !== undefined && value !== '').map(String))
const modelSuggestions = computed(() => allBrandRecords.value.map((item) => item.model))
const years = values('year')
const sticksPerBoxes = values('sticksPerBox')
const cabinets = values('cabinet')
const boxPrices = values('customBoxPrice')
const sources = values('source')
const ringGauges = values('ringGauge')
const lengths = values('lengthMm')

function selectModel(model: string): void {
  const normalized = model.trim().toLocaleLowerCase()
  const latestBox = inventory.boxes
    .filter((item) => brandKey(item.brand) === brandKey(form.brand) && item.model.trim().toLocaleLowerCase() === normalized)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const latestAny = allBrandRecords.value.find((item) => item.model.trim().toLocaleLowerCase() === normalized)
  if (latestAny) {
    form.year = String(latestAny.year)
    form.cabinet = latestAny.cabinet
  }
  if (latestBox) Object.assign(form, {
    year: String(latestBox.year), sticksPerBox: String(latestBox.sticksPerBox), cabinet: latestBox.cabinet,
    customBoxPrice: String(latestBox.customBoxPrice), source: latestBox.source ?? '',
    ringGauge: latestBox.ringGauge ? String(latestBox.ringGauge) : '',
    lengthMm: latestBox.lengthMm ? String(latestBox.lengthMm) : ''
  })
}

function submit(): void {
  if (!valid.value) return
  emit('save', {
    brand: form.brand.trim(), model: form.model.trim(), year: Number(form.year),
    sticksPerBox: Number(form.sticksPerBox), cabinet: form.cabinet.trim(),
    customBoxPrice: Number(form.customBoxPrice),
    serialNumber: form.serialNumber.trim() || undefined,
    source: form.source.trim() || undefined,
    ringGauge: form.ringGauge ? Number(form.ringGauge) : undefined,
    lengthMm: form.lengthMm ? Number(form.lengthMm) : undefined,
    stockedAt: new Date(form.stockedAt).toISOString()
  })
}
</script>

<template>
  <van-form class="stock-form" @submit="submit">
    <BrandField v-model="form.brand" />
    <HistoryField v-model="form.model" label="型号" placeholder="输入或选择历史型号" :suggestions="modelSuggestions" required @select="selectModel" />
    <HistoryField v-model="form.year" type="digit" label="年份" placeholder="例如 2024" :suggestions="years" required maxlength="4" />
    <HistoryField v-model="form.sticksPerBox" type="digit" label="每盒支数" :suggestions="sticksPerBoxes" required />
    <HistoryField v-model="form.cabinet" label="柜号" placeholder="必填" :suggestions="cabinets" required />
    <HistoryField v-model="form.customBoxPrice" type="number" label="每盒价格" :suggestions="boxPrices" required />
    <van-field v-model="form.serialNumber" label="编号" placeholder="可选" />
    <HistoryField v-model="form.source" label="来源/渠道" placeholder="可选" :suggestions="sources" />
    <HistoryField v-model="form.ringGauge" type="digit" label="环径" placeholder="可选" :suggestions="ringGauges" />
    <HistoryField v-model="form.lengthMm" type="digit" label="长度(mm)" placeholder="可选" :suggestions="lengths" />
    <van-field v-model="form.stockedAt" type="datetime-local" label="入库时间" required />
    <div class="form-actions"><van-button native-type="submit" type="primary" block round :disabled="!valid">保存</van-button></div>
  </van-form>
</template>
