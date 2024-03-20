<script setup>
import {watch} from 'vue';
import {useRoute} from 'vue-router';
import {useUserStore} from "./stores/user";

import Header from './components/header/Header.vue';
import Footer from './components/Footer.vue';

const userStore = useUserStore();
const route = useRoute();

watch(() => route.name, () => {
  if(userStore.userData) userStore.racdaAlert();
});
</script>

<template>
    <div v-if="userStore.loadingUser" class="d-flex flex-column min-dvh-100 justify-content-center align-items-center">
      <div v-if="userStore.userData" class="h1 text-center animate__animated animate__fadeInDown">Bienvenid@, {{userStore.userData.name}}</div>
      
      <div class="spinner-border mt-4" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div v-else class="d-flex flex-column min-dvh-100">
      <Header />
      <router-view />
      <Footer />
    </div>
</template>