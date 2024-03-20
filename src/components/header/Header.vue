<script setup lang="ts">
import {useUserStore} from '../../stores/user';
import {Tooltip} from 'bootstrap';

import Bar from './Bar.vue';

const userStore = useUserStore();

new Tooltip(document.body, {
  selector: "[data-bs-toggle='tooltip']"
});
</script>

<template>
  <header class="header d-md-flex  p-4">
    <div class="header__content container-md d-md-flex justify-content-between align-items-center">

      <div class="header__main d-flex justify-content-between align-items-center">
        <div :class="{
          'header__logo d-none' : userStore.userData && userStore.emailVerified,
          'header__logo' : !userStore.userData && !userStore.emailVerified,
          }"
        >
          <RouterLink to="/"><img class="header__logo-image" src="../../assets/gt.png" width="150" height="40"></RouterLink>
        </div>

        <div class="header__company d-flex align-items-center pe-2">
          <img class="header__racda" v-if="userStore.wait === 1 && userStore.userData" src="../../assets/check-mark.png" alt="check-mark" width="40" height="40" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Racda Vigente">
          <img class="header__racda" v-else-if="userStore.wait === 2 && userStore.userData" src="../../assets/x.png"  alt="cross-mark" width="30" height="27" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Racda Vencido">
          <img class="header__racda" v-else-if="userStore.wait === 3 && userStore.userData" src="../../assets/y.png"  alt="yellow-mark" width="30" height="27" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Ingrese Fecha de Venc. Racda">
          <img class="header__company-image rounded-circle" v-if="userStore.userData && userStore.emailVerified" :src= userStore.userData.photo alt="imagen empresa" width="50" height="40">
          <p class="header__company-name ms-3 my-0" v-if="userStore.userData && userStore.emailVerified">{{userStore.userData.name}}</p>
        </div>

        <i :class="{
          'header__collapse d-md-none bi bi-list' : !userStore.menuToggle,
          'header__collapse d-md-none bi bi-x-lg' : userStore.menuToggle
          }" 
          @click="() => userStore.menuToggle = !userStore.menuToggle">
        </i>
      </div>

      <div :class="{
        'header__bar justify-content-start justify-content-md-between flex-column flex-md-row animate__animated animate__slideInLeft animate__faster gap-4 gap-md-0 pt-5 pt-md-2' : userStore.menuToggle,
        'header__bar d-none d-md-flex justify-content-end' : !userStore.menuToggle
        }"
      >
        <Bar />
      </div>

    </div>
  </header>
</template>