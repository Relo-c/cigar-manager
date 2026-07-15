<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showConfirmDialog, showSuccessToast } from 'vant'
import LooseForm from '../components/LooseForm.vue'
import OutboundForm from '../components/OutboundForm.vue'
import { createOrMergeLoose, deleteLoose, outboundLoose, updateLoose, type LooseInput } from '../services/inventory'
import { useInventoryStore } from '../stores/inventory'
import type { LooseInventory } from '../types/inventory'
const inventory = useInventoryStore(); const query = ref(''); const showForm = ref(false); const showOutbound = ref(false); const editing = ref<LooseInventory>(); const target=ref<LooseInventory>()
defineProps<{ embedded?: boolean }>()
onMounted(inventory.load)
const filtered = computed(() => { const q=query.value.trim().toLowerCase(); return !q ? inventory.looseStocks : inventory.looseStocks.filter((s)=>[s.brand,s.model,s.year,s.cabinet].some((v)=>String(v).toLowerCase().includes(q))) })
function open(stock?: LooseInventory) { editing.value=stock; showForm.value=true }
async function save(input: LooseInput) { editing.value ? await updateLoose(editing.value,input) : await createOrMergeLoose(input); showForm.value=false; await inventory.load(); showSuccessToast('已保存') }
async function remove(stock: LooseInventory) { try { await showConfirmDialog({title:'删除这条散养库存？',message:`${stock.brand} ${stock.model} · ${stock.quantity} 支`,confirmButtonText:'删除',confirmButtonColor:'#d54b4b'}); await deleteLoose(stock); await inventory.load(); showSuccessToast('已删除并记录') } catch {} }
function openOutbound(stock:LooseInventory){ target.value=stock; showOutbound.value=true }
async function saveOutbound(value:{quantity:number;reason:import('../types/inventory').OutboundReason;occurredAt:string;note?:string}){if(!target.value)return;await outboundLoose(target.value,value.quantity,value.reason,value.occurredAt,value.note);showOutbound.value=false;await inventory.load();showSuccessToast('出库完成')}
</script>
<template><section><header v-if="!embedded" class="page-header"><p class="eyebrow">散养</p><h1>{{ inventory.looseStickCount }} 支库存</h1></header><div v-else class="embedded-summary"><strong>{{ inventory.looseStickCount }} 支</strong><span>{{ inventory.looseStocks.length }} 组散养库存</span></div><van-search v-model="query" placeholder="搜索品牌、型号、年份或柜号" shape="round" />
  <div v-if="filtered.length" class="stock-list"><article v-for="stock in filtered" :key="stock.id" class="stock-card" @click="open(stock)"><div><span class="stock-meta">{{ stock.brand }} · {{ stock.year }} · 柜 {{ stock.cabinet }}</span><h2>{{ stock.model }}</h2><p>{{ stock.quantity }} 支 · ¥{{ stock.customStickPrice.toLocaleString() }}/支</p><div class="card-actions"><button @click.stop="openOutbound(stock)">出库</button><button class="danger" @click.stop="remove(stock)">删除</button></div></div><div class="stock-value">¥{{ (stock.quantity*stock.customStickPrice).toLocaleString() }}</div></article></div><van-empty v-else description="暂无散养库存" />
  <van-floating-bubble icon="plus" axis="xy" magnetic="x" :gap="{ x: 24, y: 88 }" @click="open()" /><van-popup v-model:show="showForm" position="bottom" round :style="{height:'78%'}"><div class="sheet-header"><strong>{{ editing?'编辑散养':'新增散养' }}</strong><van-icon name="cross" @click="showForm=false" /></div><LooseForm :model-value="editing" @save="save" /></van-popup>
  <van-popup v-model:show="showOutbound" position="bottom" round><div class="sheet-header"><strong>散养出库</strong><van-icon name="cross" @click="showOutbound=false" /></div><OutboundForm v-if="target" :max-quantity="target.quantity" @save="saveOutbound" /></van-popup>
</section></template>
