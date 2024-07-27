import { createWebHistory, createRouter } from 'vue-router'

import Ranking from './components/Ranking.vue'
import Results from './components/Results.vue'
import Presubmission from './components/Presubmission.vue'
import Submit from './components/Submit.vue'

const routes = [
  { path: '/', component: Ranking },
  { path: '/presubmission', component: Presubmission },
  { path: '/submit', component: Submit },

  { path: '/results', component: Results },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})