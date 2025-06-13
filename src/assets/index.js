import { createRouter, createWebHistory } from 'vue-router';
import PokedexView from '../views/PokedexView.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: PokedexView
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
