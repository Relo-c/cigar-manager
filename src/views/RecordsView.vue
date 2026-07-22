<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { db } from '../db/database'
import type {
  BoxInventory,
  LooseInventory,
  OperationRecord,
  OutboundReason
} from '../types/inventory'

const records = ref<OperationRecord[]>([])
const operationLabels: Record<OperationRecord['type'], string> = {
  'stock-in': '入库',
  'stock-out': '出库',
  unbox: '拆盒',
  'price-change': '价格修改',
  delete: '删除',
  restore: '恢复'
}
const outboundReasonLabels: Record<OutboundReason, string> = {
  'self-use': '自用',
  gift: '赠送',
  sale: '出售',
  other: '其他'
}
const money = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 2
})

async function load(): Promise<void> {
  records.value = await db.operations.orderBy('occurredAt').reverse().toArray()
}

function quantityUnit(record: OperationRecord): string {
  return record.type === 'unbox' || record.inventoryKind === 'loose' ? '支' : '盒'
}

function priceLabel(record: OperationRecord): string {
  if (!record.snapshot) return ''
  return record.inventoryKind === 'box'
    ? `${money.format((record.snapshot as BoxInventory).customBoxPrice)}/盒`
    : `${money.format((record.snapshot as LooseInventory).customStickPrice)}/支`
}

onMounted(load)
</script>

<template>
  <section>
    <header class="page-header">
      <p class="eyebrow">操作记录</p>
      <h1>库存动态</h1>
    </header>
    <div v-if="records.length" class="record-list">
      <article v-for="record in records" :key="record.id" class="record-card">
        <span>
          {{ operationLabels[record.type] }} ·
          {{ record.inventoryKind === 'box' ? '原盒' : '散养' }}
        </span>
        <strong>{{ record.snapshot?.brand }} {{ record.snapshot?.model }}</strong>
        <small v-if="record.quantity">
          数量 {{ record.quantity }} {{ quantityUnit(record) }}
        </small>
        <small v-if="record.snapshot">
          {{ record.snapshot.year }}年 · 柜 {{ record.snapshot.cabinet || '—' }} ·
          {{ priceLabel(record) }}
        </small>
        <small
          v-if="record.type === 'stock-out' && record.outboundReason"
        >
          原因 {{ outboundReasonLabels[record.outboundReason] }}
        </small>
        <small v-if="record.note">备注 {{ record.note }}</small>
        <time>{{ new Date(record.occurredAt).toLocaleString('zh-CN') }}</time>
      </article>
    </div>
    <van-empty v-else description="暂无操作记录" />
  </section>
</template>
