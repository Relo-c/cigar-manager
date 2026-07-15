<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { BoxInput } from '../services/inventory'
import type { BoxInventory } from '../types/inventory'

const props = defineProps<{ modelValue?: BoxInventory }>()
const emit = defineEmits<{ save: [value: BoxInput] }>()

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
    <van-field v-model="form.brand" label="品牌" placeholder="必填" required />
    <van-field v-model="form.model" label="型号" placeholder="必填" required />
    <van-field v-model="form.year" type="digit" label="年份" placeholder="例如 2024" required maxlength="4" />
    <van-field v-model="form.sticksPerBox" type="digit" label="每盒支数" required />
    <van-field v-model="form.cabinet" label="柜号" placeholder="必填" required />
    <van-field v-model="form.customBoxPrice" type="number" label="每盒价格" required />
    <van-field v-model="form.serialNumber" label="编号" placeholder="可选" />
    <van-field v-model="form.source" label="来源/渠道" placeholder="可选" />
    <van-field v-model="form.ringGauge" type="digit" label="环径" placeholder="可选" />
    <van-field v-model="form.lengthMm" type="digit" label="长度(mm)" placeholder="可选" />
    <van-field v-model="form.stockedAt" type="datetime-local" label="入库时间" required />
    <div class="form-actions"><van-button native-type="submit" type="primary" block round :disabled="!valid">保存</van-button></div>
  </van-form>
</template>
