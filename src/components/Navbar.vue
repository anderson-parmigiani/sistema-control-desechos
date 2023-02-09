<script setup>
import { useUserStore } from '../stores/user';
import { Tooltip } from "bootstrap";
import { watch, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';

const userStore = useUserStore();
const route = useRoute();

new Tooltip(document.body, {
  selector: "[data-bs-toggle='tooltip']",
});

watch(() => route.params, () => {
  if(userStore.userData){
    userStore.racdaAlert()
  };
});
</script>

<template>
  <!-- <nav class="navbar navbar-expand">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">
        <img src="https://img.icons8.com/nolan/48/warning-shield.png" width="30" class="logo"/>
      </a>
        <div class="navbar-nav ml-auto">
          <a class="nav-link active" aria-current="page" href="#">Dashboard</a>
          <a class="nav-link" href="#">Candidate</a>
          <a class="nav-link" href="#">training</a>
          <a class="nav-link" href="#">Reports</a>

          <a class="nav-link" href="#">Meet</a>
          <a class="nav-link" href="#">Settings</a>
        </div>
    </div>
  </nav> -->
  <!-- <nav class="navbar py-3">
    <div class="pe-lg-0 ps-lg-5 container-fluid justify-content-between">
        <a class="navbar-brand" href="#">
            <img src="../assets/gt.png" height="60" alt="logo">
        </a>
        <div class="justify-content-end" id="navbarSupportedContent">
            <div class="nav-left d-flex align-items-center">
                <nav>
                    <div class="nav d-flex nav-tabs" id="nav-tab" role="tablist">
                        <button class="nav-link active" id="home-tab" data-bs-toggle="tab" data-bs-target="#home"
                            type="button" role="tab" aria-controls="home" aria-selected="true">Home</button>
                        <button class="nav-link" id="about-tab" data-bs-toggle="tab" data-bs-target="#about"
                            type="button" role="tab" aria-controls="about" aria-selected="false">About</button>
                        <button class="nav-link" id="timing-tab" data-bs-toggle="tab" data-bs-target="#timing"
                            type="button" role="tab" aria-controls="timing" aria-selected="false">Timing</button>
                        <button class="nav-link" id="courses-tab" data-bs-toggle="tab" data-bs-target="#courses"
                            type="button" role="tab" aria-controls="courses" aria-selected="false">Courses</button>
                    </div>
                </nav>
            </div>
        </div>
    </div>
  </nav> -->

    <nav class="navbar navbar-expand bg-light">
      <div class="container-fluid">
        <RouterLink class="ms-3 py-0 navbar-brand d-none d-md-block" to="/"><img class="" src="../assets/gt.png"  width="150" height="40"></RouterLink>
        <!-- <RouterLink class="navbar-brand d-none d-md-block" to="/">Green Tree</RouterLink> -->
          <div class="navbar-nav ms-auto me-3">
            <img class="me-1" v-if="userStore.wait == 1 && userStore.userData" src="../assets/check-mark.png" alt="check-mark" width="40" height="40" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Racda Vigente">
            <img class="me-2 mt-2" v-else-if="userStore.wait == 2 && userStore.userData" src="../assets/x.png"  alt="cross-mark" width="30" height="27" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Racda Vencido">
            <img class="me-2 mt-2" v-else-if="userStore.wait == 3 && userStore.userData" src="../assets/y.png"  alt="yellow-mark" width="30" height="27" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Ingrese Fecha de Venc. Racda">
            <img class="me-2 rounded-circle" v-if="userStore.userData && userStore.emailVerified" :src= userStore.userData.photo alt="Company" width="50" height="40" >
            <span class="navbar-text me-5" v-if="userStore.userData && userStore.emailVerified">{{userStore.userData.name}}</span>
            <RouterLink class="nav-link" to="/" v-if="userStore.userData">Inicio</RouterLink>
            <RouterLink class="nav-link" to="/registro" v-if="!userStore.userData">Regístrate</RouterLink>
            <RouterLink class="nav-link" to="/autenticacion" v-if="!userStore.userData">Iniciar Sesión</RouterLink>
            <RouterLink class="nav-link" to="/usuario" v-if="userStore.userData">Usuario</RouterLink>
            <RouterLink class="nav-link" to="/empresas" v-if="userStore.userData">Empresas</RouterLink>
            <button class="btn btn-link nav-link" @click="userStore.logout" v-if="userStore.userData">Salir</button>
          </div>
      </div>
    </nav>
</template>