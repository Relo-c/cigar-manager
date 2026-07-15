<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { showConfirmDialog, showSuccessToast } from 'vant'
import { db } from '../db/database'
import { restoreDeleted } from '../services/inventory'
import type { OperationRecord } from '../types/inventory'
const records=ref<OperationRecord[]>([])
const labels: Record<OperationRecord['type'],string>={ 'stock-in':'入库','stock-out':'出库','unbox':'拆盒','price-change':'价格修改','delete':'删除','restore':'恢复' }
async function load(){ records.value=await db.operations.orderBy('occurredAt').reverse().toArray() }
onMounted(load)
async function restore(record:OperationRecord){try{await showConfirmDialog({title:'恢复这条库存？',message:`${record.snapshot?.brand} ${record.snapshot?.model}`,confirmButtonText:'恢复'});await restoreDeleted(record);await load();showSuccessToast('库存已恢复')}catch{}}
</script>
<template><section><header class="page-header"><p class="eyebrow">操作记录</p><h1>库存动态</h1></header><div v-if="records.length" class="record-list"><article v-for="record in records" :key="record.id" class="record-card"><span>{{ labels[record.type] }} · {{ record.inventoryKind==='box'?'原盒':'散养' }}</span><strong>{{ record.snapshot?.brand }} {{ record.snapshot?.model }}</strong><small v-if="record.quantity">数量 {{ record.quantity }}</small><time>{{ new Date(record.occurredAt).toLocaleString('zh-CN') }}</time><van-button v-if="record.type==='delete'" size="small" plain type="primary" @click="restore(record)">恢复库存</van-button></article></div><van-empty v-else description="暂无操作记录" /></section></template>
