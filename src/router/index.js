import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

const requireAuthInicio = async (to, from, next) => {
  const userStore = useUserStore();
  userStore.loading = true;

  if(from.path == '/' || from.path == '/usuario' || from.path == '/recuperacion' || from.path == '/empresas' || from.name == 'desecho'){
    userStore.loading = false;
  }

  const user = await userStore.currentUser();

  if (user && user.emailVerified) {
    if(to.name == 'NotFound'){
      next('/');
    }
    else{
      await userStore.personalRacda();
      next();
    }
  }

  else {
      next("/autenticacion");
  }

  userStore.loading = false;
};

const authLogin = async (to, from, next) => {
  const userStore = useUserStore();
  const user = await userStore.currentUser();
  if (!user) {
    next();
  }

  else if (user && !user.emailVerified) {
    next();
  }

  else if (user && user.emailVerified) {
    next("/");
  }
};

const waitUser = async (to, from, next) => {
  const userStore = useUserStore();
  const user = await userStore.currentUser();

  if (user && user.emailVerified) {
    await userStore.personalRacda();
  }
    next();
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