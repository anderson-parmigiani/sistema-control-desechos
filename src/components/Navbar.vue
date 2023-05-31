<script setup lang="ts">
import { useUserStore } from '../stores/user';
import { Tooltip } from 'bootstrap';
import { storage } from '../firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';

const userStore = useUserStore();

new Tooltip(document.body, {
  selector: "[data-bs-toggle='tooltip']"
});

const downloadGuide = async () => {
  try {
    const guideRef = ref(storage, '/documents/Manual de Usuario.pdf');
    const url = await getDownloadURL(guideRef);
    window.open(url);
  } catch (e) {
    console.log(e.message);
  }
};
</script>

<template>
  <nav class="navbar navbar-expand bg-light">
    <div class="container-fluid">
      <RouterLink class="ms-3 py-0 navbar-brand d-none d-md-block" to="/"><img class="" src="../assets/gt.png"  width="150" height="40"></RouterLink>
      <div class="navbar-nav ms-auto me-3">
        <img class="me-1" v-if="userStore.wait === 1 && userStore.userData" src="../assets/check-mark.png" alt="check-mark" width="40" height="40" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Racda Vigente">
        <img class="me-2 mt-2" v-else-if="userStore.wait === 2 && userStore.userData" src="../assets/x.png"  alt="cross-mark" width="30" height="27" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Racda Vencido">
        <img class="me-2 mt-2" v-else-if="userStore.wait === 3 && userStore.userData" src="../assets/y.png"  alt="yellow-mark" width="30" height="27" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Ingrese Fecha de Venc. Racda">
        <img class="me-2 rounded-circle" v-if="userStore.userData && userStore.emailVerified" :src= userStore.userData.photo alt="Company" width="50" height="40" >
        <span class="navbar-text me-5" v-if="userStore.userData && userStore.emailVerified">{{userStore.userData.name}}</span>
        <RouterLink class="nav-link" :to="{ name: 'inicio'}" v-if="userStore.userData">Inicio</RouterLink>
        <RouterLink class="nav-link" :to="{ name: 'registro'}" v-if="!userStore.userData">Regístrate</RouterLink>
        <RouterLink class="nav-link" :to="{ name: 'autenticacion'}" v-if="!userStore.userData">Iniciar Sesión</RouterLink>
        <RouterLink class="nav-link" :to="{ name: 'usuario'}" v-if="userStore.userData">Usuario</RouterLink>
        <RouterLink class="nav-link" :to="{ name: 'empresas'}" v-if="userStore.userData">Empresas</RouterLink>
        <button class="btn btn-link nav-link" @click="userStore.logout" v-if="userStore.userData">Salir</button>
        <button class="ms-2 btn btn-link nav-link" @click="downloadGuide"><i class="bi bi-question-square"></i></button>
      </div>
    </div>
  </nav>
</template>