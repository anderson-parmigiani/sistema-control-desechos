<script setup lang="ts">
import { useUserStore } from '../stores/user';
import { Tooltip } from 'bootstrap';
import { storage } from '../firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'vue-router';
import { ref as refv } from 'vue';
const router = useRouter();
const authRoute = refv(false);

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

router.beforeEach(to => {
    authRoute.value = to.name === 'autenticacion' || to.name === 'registro' || to.name === 'recuperacion';
});
</script>

<template>
  <nav class="navbar navbar-expand bg-light mb-5 p-3">
    <div class="container-fluid justify-content-center">
      <RouterLink v-if="authRoute" class="ms-3 py-0 navbar-brand" :class="'d-none d-sm-block'" to="/"><img src="../assets/gt.png"  width="150" height="40"></RouterLink>
      <RouterLink v-else class="ms-3 py-0 navbar-brand d-none d-lg-block" to="/"><img src="../assets/gt.png"  width="150" height="40"></RouterLink>
      <div class="navbar-nav justify-content-center align-items-center ms-lg-auto me-lg-3" :class="{ 'ms-sm-auto' : authRoute, 'flex-column flex-md-row' : !authRoute}">
        <img class="me-md-1 d-none d-md-block" v-if="userStore.wait === 1 && userStore.userData" src="../assets/check-mark.png" alt="check-mark" width="40" height="40" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Racda Vigente">
        <img class="me-md-2 d-none d-md-block" v-else-if="userStore.wait === 2 && userStore.userData" src="../assets/x.png"  alt="cross-mark" width="30" height="27" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Racda Vencido">
        <img class="me-md-2 d-none d-md-block" v-else-if="userStore.wait === 3 && userStore.userData" src="../assets/y.png"  alt="yellow-mark" width="30" height="27" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Ingrese Fecha de Venc. Racda">
        <img class="me-md-2 rounded-circle d-none d-md-block" v-if="userStore.userData && userStore.emailVerified" :src= userStore.userData.photo alt="Company" width="50" height="40" >
        <div class="d-flex d-md-none align-items-center gap-2">
          <img v-if="userStore.wait === 1 && userStore.userData" src="../assets/check-mark.png" alt="check-mark" width="40" height="40" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Racda Vigente">
          <img v-else-if="userStore.wait === 2 && userStore.userData" src="../assets/x.png"  alt="cross-mark" width="30" height="27" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Racda Vencido">
          <img v-else-if="userStore.wait === 3 && userStore.userData" src="../assets/y.png"  alt="yellow-mark" width="30" height="27" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Ingrese Fecha de Venc. Racda">
          <img class="rounded-circle" v-if="userStore.userData && userStore.emailVerified" :src= userStore.userData.photo alt="Company" width="50" height="40" >
        </div>
        <span class="navbar-text me-md-5 " v-if="userStore.userData && userStore.emailVerified">{{userStore.userData.name}}</span>
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