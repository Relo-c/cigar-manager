<script setup lang="ts">
import { computed, reactive } from 'vue'
import type {
  OutboundFormValue,
  OutboundReason,
  OutboundUnit
} from '../types/inventory'

const props = defineProps<{ maxQuantity: number; isBox?: boolean }>()
const emit = defineEmits<{ save: [value: OutboundFormValue] }>()
const form = reactive({
  unit: (props.isBox ? 'box' : 'stick') as OutboundUnit,
  quantity: props.isBox ? '1' : '',
  reason: 'self-use' as OutboundReason,
  occurredAt: new Date().toISOString().slice(0, 16),
  note: ''
})
const actualQuantity = computed(() =>
  props.isBox && form.unit === 'box' ? 1 : Number(form.quantity)
)
const valid = computed(
  () =>
    Number.isInteger(actualQuantity.value) &&
    actualQuantity.value > 0 &&
    actualQuantity.value <= props.maxQuantity &&
    form.occurredAt
)

function submit(): void {
  if (!valid.value) return
  emit('save', {
    quantity: actualQuantity.value,
    unit: form.unit,
    reason: form.reason,
    occurredAt: new Date(form.occurredAt).toISOString(),
    note: form.note.trim() || undefined
  })
}
</script>

<template>
  <van-form class="stock-form" @submit="submit">
    <van-field v-if="isBox" label="出库方式">
      <template #input>
        <select v-model="form.unit" class="native-select">
          <option value="box">整盒出库</option>
          <option value="stick">按支出库</option>
        </select>
      </template>
    </van-field>
    <van-field
      v-if="!isBox || form.unit === 'stick'"
      v-model="form.quantity"
      type="digit"
      label="出库支数"
      :placeholder="`最多 ${maxQuantity} 支`"
      required
    />
    <van-field label="出库原因">
      <template #input>
        <select v-model="form.reason" class="native-select">
          <option value="self-use">自用</option>
          <option value="gift">赠送</option>
          <option value="sale">出售</option>
          <option value="other">其他</option>
        </select>
      </template>
    </van-field>
    <van-field
      v-model="form.occurredAt"
      type="datetime-local"
      label="出库时间"
      required
    />
    <van-field
      v-model="form.note"
      type="textarea"
      label="备注"
      placeholder="可选"
      rows="2"
    />
    <div class="form-actions">
      <van-button native-type="submit" type="primary" block round :disabled="!valid">
        确认出库
      </van-button>
    </div>
  </van-form>
</template>
