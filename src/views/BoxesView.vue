<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showConfirmDialog, showSuccessToast } from 'vant'
import BoxForm from '../components/BoxForm.vue'
import BrandLogo from '../components/BrandLogo.vue'
import OutboundForm from '../components/OutboundForm.vue'
import { createBox, deleteBox, outboundBox, unboxInventory, updateBox, type BoxInput } from '../services/inventory'
import { useInventoryStore } from '../stores/inventory'
import type { BoxInventory } from '../types/inventory'
const inventory = useInventoryStore(); const query = ref(''); const showForm = ref(false); const showOutbound = ref(false); const editing = ref<BoxInventory>(); const target = ref<BoxInventory>()
defineProps<{ embedded?: boolean }>()
onMounted(inventory.load)
const filtered = computed(() => { const q = query.value.trim().toLowerCase(); return !q ? inventory.boxes : inventory.boxes.filter((b) => [b.brand,b.model,b.year,b.cabinet].some((v) => String(v).toLowerCase().includes(q))) })
function open(box?: BoxInventory) { editing.value = box; showForm.value = true }
async function save(input: BoxInput) { editing.value ? await updateBox(editing.value, input) : await createBox(input); showForm.value = false; await inventory.load(); showSuccessToast('已保存') }
async function remove(box: BoxInventory) { try { await showConfirmDialog({ title: '删除这盒库存？', message: `${box.brand} ${box.model} · ${box.year}`, confirmButtonText: '删除', confirmButtonColor: '#d54b4b' }); await deleteBox(box); await inventory.load(); showSuccessToast('已删除并记录') } catch {} }
async function unbox(box: BoxInventory) { const suggested=box.customBoxPrice/box.sticksPerBox; try { const result=await showConfirmDialog({title:'整盒转入散养？',message:`${box.sticksPerBox} 支将转入柜 ${box.cabinet}\n默认散支价 ¥${suggested.toFixed(2)}`,confirmButtonText:'确认拆盒'}); if(result==='confirm'){ await unboxInventory(box,suggested); await inventory.load(); showSuccessToast('拆盒完成') } } catch {} }
function openOutbound(box: BoxInventory) { target.value=box; showOutbound.value=true }
async function saveOutbound(value: {reason: import('../types/inventory').OutboundReason; occurredAt:string; note?:string}) { if(!target.value)return; await outboundBox(target.value,value.reason,value.occurredAt,value.note); showOutbound.value=false; await inventory.load(); showSuccessToast('出库完成') }
</script>
<template><section><header v-if="!embedded" class="page-header"><p class="eyebrow">原盒养护</p><h1>{{ inventory.boxCount }} 盒库存</h1></header><div v-else class="embedded-summary"><strong>{{ inventory.boxCount }} 盒</strong><span>{{ inventory.boxedStickCount }} 支原盒库存</span></div><van-search v-model="query" placeholder="搜索品牌、型号、年份或柜号" shape="round" />
  <div v-if="filtered.length" class="stock-list"><article v-for="box in filtered" :key="box.id" class="stock-card" @click="open(box)"><BrandLogo :brand="box.brand" /><div class="stock-card__content"><span class="stock-meta">{{ box.brand }} · {{ box.year }} · 柜 {{ box.cabinet }}</span><h2>{{ box.model }}</h2><p>{{ box.sticksPerBox }} 支/盒 <template v-if="box.serialNumber">· {{ box.serialNumber }}</template></p><div class="card-actions"><button @click.stop="unbox(box)">拆盒</button><button @click.stop="openOutbound(box)">出库</button><button class="danger" @click.stop="remove(box)">删除</button></div></div><div class="stock-value">¥{{ box.customBoxPrice.toLocaleString() }}</div></article></div><van-empty v-else description="暂无原盒库存" />
  <van-floating-bubble icon="plus" axis="xy" magnetic="x" :gap="{ x: 24, y: 88 }" @click="open()" />
  <van-popup v-model:show="showForm" position="bottom" round :style="{ height: '88%' }"><div class="sheet-header"><strong>{{ editing ? '编辑原盒' : '新增原盒' }}</strong><van-icon name="cross" @click="showForm=false" /></div><BoxForm :model-value="editing" @save="save" /></van-popup>
  <van-popup v-model:show="showOutbound" position="bottom" round><div class="sheet-header"><strong>原盒出库</strong><van-icon name="cross" @click="showOutbound=false" /></div><OutboundForm :max-quantity="1" is-box @save="saveOutbound" /></van-popup>
</section></template>
