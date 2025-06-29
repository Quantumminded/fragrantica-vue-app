import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
const Home = () => import('./pages/Home.vue');
const BrandDetails = () => import('./pages/BrandDetails.vue');

const PerfumeDetails = () => import('./pages/PerfumeDetails.vue');

const routes = [
  { path: '/', component: Home, name: 'home' },
  { path: '/brand/:name', name: 'brand', component: BrandDetails, props: true },
  { path: '/perfume', name: 'perfume', component: PerfumeDetails, props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
