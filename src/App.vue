<script setup>
import { useUserStore } from "./stores/user";
import Footer from './components/Footer.vue';
import Navbar from './components/Navbar.vue';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import 'animate.css';

const userStore = useUserStore();
</script>

<template>
  <div v-if="userStore.loadingUser" class="d-flex justify-content-center align-items-center flex-column min-vh-100">
    <div v-if="userStore.userData" class="h1 mb-5 pb-5 animate__animated animate__fadeInDown">Bienvenido, {{userStore.userData.name}}</div>
    <div class="spinner-border" style="width: 4rem; height: 4rem;" role="status">
      <span class="visually-hidden">Cargando...</span>
    </div>
  </div>
  <div v-else class="d-flex flex-column min-vh-100" >
    <Navbar></Navbar>
    <router-view></router-view>
    <Footer></Footer>
  </div>
</template>