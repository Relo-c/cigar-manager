<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import DataTools from '../components/DataTools.vue'
import { useInventoryStore } from '../stores/inventory'
const inventory = useInventoryStore()
const quantityChart=ref<HTMLElement>();const valueChart=ref<HTMLElement>();const showTools=ref(false);let quantityInstance:echarts.ECharts|undefined;let valueInstance:echarts.ECharts|undefined
const brands=computed(()=>{const map=new Map<string,{quantity:number;value:number}>();for(const b of inventory.boxes){const v=map.get(b.brand)??{quantity:0,value:0};v.quantity+=b.sticksPerBox;v.value+=b.customBoxPrice;map.set(b.brand,v)}for(const s of inventory.looseStocks){const v=map.get(s.brand)??{quantity:0,value:0};v.quantity+=s.quantity;v.value+=s.quantity*s.customStickPrice;map.set(s.brand,v)}return [...map.entries()].sort((a,b)=>b[1].value-a[1].value)})
function render(){if(!quantityChart.value||!valueChart.value)return;quantityInstance??=echarts.init(quantityChart.value);valueInstance??=echarts.init(valueChart.value);const names=brands.value.map(([name])=>name).reverse();const base={grid:{left:70,right:18,top:10,bottom:25},xAxis:{type:'value'},yAxis:{type:'category',data:names},tooltip:{trigger:'axis'},color:['#4f8068']};quantityInstance.setOption({...base,series:[{type:'bar',data:brands.value.map(([,v])=>v.quantity).reverse(),barMaxWidth:18}]});valueInstance.setOption({...base,series:[{type:'bar',data:brands.value.map(([,v])=>v.value).reverse(),barMaxWidth:18}]})}
onMounted(async()=>{await inventory.load();await nextTick();render()});watch(brands,()=>nextTick(render));onBeforeUnmount(()=>{quantityInstance?.dispose();valueInstance?.dispose()})
const money = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 })
</script>

<template>
  <section><header class="page-header"><p class="eyebrow">概况</p><h1>库存一览</h1></header>
    <div class="metric-grid">
      <article><span>原盒总数</span><strong>{{ inventory.boxCount }}<small> 盒</small></strong></article>
      <article><span>原盒总支数</span><strong>{{ inventory.boxedStickCount }}<small> 支</small></strong></article>
      <article><span>散养总支数</span><strong>{{ inventory.looseStickCount }}<small> 支</small></strong></article>
      <article><span>库存总价值</span><strong class="money">{{ money.format(inventory.totalValue) }}</strong></article>
    </div>
    <div class="section-title"><strong>品牌库存数量</strong><button @click="showTools=true">数据管理</button></div><div v-if="brands.length" ref="quantityChart" class="brand-chart"></div><div v-else class="empty-card"><span>导入或新增库存后显示品牌图表</span></div>
    <div v-if="brands.length" class="section-title"><strong>品牌库存价值</strong></div><div v-if="brands.length" ref="valueChart" class="brand-chart"></div>
    <van-popup v-model:show="showTools" position="bottom" round :style="{minHeight:'56%'}"><DataTools @close="showTools=false" /></van-popup>
  </section>
</template>
