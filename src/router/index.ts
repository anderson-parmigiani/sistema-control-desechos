import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

const requireAuthInicio = async (to, from, next) => {
  try {
    const userStore = useUserStore();
  
    // if(from.path == '/' || from.path == '/usuario' || from.path == '/recuperacion' || from.path == '/empresas' || from.name == 'desecho')
    //   userStore.loading = false;
  
    const user = await userStore.currentUser();
  
    if (user && userStore.auth.currentUser.emailVerified){
      if(to.name == 'NotFound'){
        next('/');
      } else {
        await userStore.personalRacda();
        next();
      }
    } else {
      next("/autenticacion");
    }
  } catch (e) {
    console.log(e.message);
  }
};

const authLogin = async (to, from, next) => {
  try {
    const userStore = useUserStore();
    const user = await userStore.currentUser();
  
    if (!user) next();
    else if (user && !userStore.auth.currentUser.emailVerified) next();
    else if (user && userStore.auth.currentUser.emailVerified) next("/");
  } catch (e) {
    console.log(e.message);
  }
};

const waitUser = async (to, from, next) => {
  try {
    const userStore = useUserStore();
    const user = await userStore.currentUser();
  
    if (user && userStore.auth.currentUser.emailVerified) await userStore.personalRacda();
    next();
  } catch (e) {
    console.log(e.message);
  }
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'inicio',
      beforeEnter: requireAuthInicio,
      component: () => import('../views/Inicio.vue')
    },
    {
      path: '/registro',
      name: 'registro',
      beforeEnter: authLogin,
      component: () => import('../views/Registro.vue')
    },
    {
      path: '/autenticacion',
      name: 'autenticacion',
      beforeEnter: authLogin,
      component: () => import('../views/Autenticacion.vue')
    },
    {
      path: '/usuario',
      name: 'usuario',
      beforeEnter: requireAuthInicio,
      component: () => import('../views/Usuario.vue')
    },
    {
      path: '/recuperacion',
      name: 'recuperacion',
      beforeEnter: waitUser,
      component: () => import('../views/Recuperacion.vue')
    },
    {
      path: '/empresas',
      name: 'empresas',
      beforeEnter: waitUser,
      component: () => import('../views/Empresas.vue')
    },
    {
      path: '/app/:name',
      name: 'desecho',
      beforeEnter: waitUser,
      component: () => import('../views/DesechoView.vue')
    },
    {
      path: '/:catchAll(.*)',
      name: 'NotFound',
      beforeEnter: requireAuthInicio,
      component: () => import('../views/Inicio.vue')
    }
  ]
});

export default router;