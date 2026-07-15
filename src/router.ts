import { createRouter, createWebHashHistory } from 'vue-router'
import OverviewView from './views/OverviewView.vue'
import BoxesView from './views/BoxesView.vue'
import LooseView from './views/LooseView.vue'
import RecordsView from './views/RecordsView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: OverviewView, meta: { tab: 0 } },
    { path: '/boxes', component: BoxesView, meta: { tab: 1 } },
    { path: '/loose', component: LooseView, meta: { tab: 2 } },
    { path: '/records', component: RecordsView, meta: { tab: 3 } }
  ]
})
