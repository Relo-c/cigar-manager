import { createRouter, createWebHashHistory } from 'vue-router'
import OverviewView from './views/OverviewView.vue'
import InventoryView from './views/InventoryView.vue'
import RecordsView from './views/RecordsView.vue'
import SettingsView from './views/SettingsView.vue'
import ThemePreviewView from './views/ThemePreviewView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: OverviewView, meta: { tab: 0 } },
    { path: '/inventory', component: InventoryView, meta: { tab: 1 } },
    { path: '/records', component: RecordsView, meta: { tab: 2 } },
    { path: '/settings', component: SettingsView, meta: { tab: 3 } },
    { path: '/theme-preview', component: ThemePreviewView, meta: { preview: true } },
    { path: '/boxes', redirect: '/inventory' },
    { path: '/loose', redirect: { path: '/inventory', query: { mode: 'loose' } } }
  ]
})
