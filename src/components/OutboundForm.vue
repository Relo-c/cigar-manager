<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { OutboundReason } from '../types/inventory'

const props = defineProps<{ maxQuantity: number; isBox?: boolean }>()
const emit = defineEmits<{ save: [value: { quantity: number; reason: OutboundReason; occurredAt: string; note?: string }] }>()
const form = reactive({ quantity: props.isBox ? '1' : '', reason: 'self-use' as OutboundReason, occurredAt: new Date().toISOString().slice(0, 16), note: '' })
const valid = computed(() => Number.isInteger(Number(form.quantity)) && Number(form.quantity) > 0 && Number(form.quantity) <= props.maxQuantity && form.occurredAt)
function submit() { if (valid.value) emit('save', { quantity: Number(form.quantity), reason: form.reason, occurredAt: new Date(form.occurredAt).toISOString(), note: form.note.trim() || undefined }) }
</script>
<template><van-form class="stock-form" @submit="submit">
  <van-field v-if="!isBox" v-model="form.quantity" type="digit" label="出库支数" :placeholder="`最多 ${maxQuantity} 支`" required />
  <van-field label="出库原因"><template #input><select v-model="form.reason" class="native-select"><option value="self-use">自用</option><option value="gift">赠送</option><option value="sale">出售</option><option value="other">其他</option></select></template></van-field>
  <van-field v-model="form.occurredAt" type="datetime-local" label="出库时间" required />
  <van-field v-model="form.note" type="textarea" label="备注" placeholder="可选" rows="2" />
  <div class="form-actions"><van-button native-type="submit" type="primary" block round :disabled="!valid">确认出库</van-button></div>
</van-form></template>
