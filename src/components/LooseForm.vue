<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { LooseInput } from '../services/inventory'
import type { LooseInventory } from '../types/inventory'

const props = defineProps<{ modelValue?: LooseInventory }>()
const emit = defineEmits<{ save: [value: LooseInput] }>()
const form = reactive({ brand: '', model: '', year: '', quantity: '', cabinet: '', customStickPrice: '', stockedAt: '' })

watch(() => props.modelValue, (stock) => {
  Object.assign(form, stock ? {
    brand: stock.brand, model: stock.model, year: String(stock.year), quantity: String(stock.quantity),
    cabinet: stock.cabinet, customStickPrice: String(stock.customStickPrice), stockedAt: stock.stockedAt.slice(0, 16)
  } : { brand: '', model: '', year: '', quantity: '', cabinet: '', customStickPrice: '', stockedAt: new Date().toISOString().slice(0, 16) })
}, { immediate: true })

const valid = computed(() => form.brand.trim() && form.model.trim() && Number(form.year) > 0 && Number(form.quantity) > 0 && form.cabinet.trim() && Number(form.customStickPrice) >= 0 && form.stockedAt)

function submit(): void {
  if (!valid.value) return
  emit('save', { brand: form.brand.trim(), model: form.model.trim(), year: Number(form.year), quantity: Number(form.quantity), cabinet: form.cabinet.trim(), customStickPrice: Number(form.customStickPrice), stockedAt: new Date(form.stockedAt).toISOString() })
}
</script>

<template>
  <van-form class="stock-form" @submit="submit">
    <van-field v-model="form.brand" label="品牌" placeholder="必填" required />
    <van-field v-model="form.model" label="型号" placeholder="必填" required />
    <van-field v-model="form.year" type="digit" label="年份" placeholder="例如 2024" required maxlength="4" />
    <van-field v-model="form.quantity" type="digit" label="支数" required />
    <van-field v-model="form.cabinet" label="柜号" placeholder="必填" required />
    <van-field v-model="form.customStickPrice" type="number" label="每支价格" required />
    <van-field v-model="form.stockedAt" type="datetime-local" label="入库时间" required />
    <div class="form-actions"><van-button native-type="submit" type="primary" block round :disabled="!valid">保存</van-button></div>
  </van-form>
</template>
