<script setup lang="ts">
import {useUserStore} from '../../stores/user';
import {storage} from '../../firebaseConfig';
import {ref, getDownloadURL} from 'firebase/storage';

const userStore = useUserStore();

const toggleMenu = () => {
    if (window.innerWidth < 768) {
        userStore.menuToggle = !userStore.menuToggle;
    }
};

const downloadGuide = async () => {
    toggleMenu();
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
    <div class="bar d-flex flex-column flex-md-row align-items-center gap-5 gap-md-5 pt-5 pt-md-0">
        <nav class="bar__links d-flex flex-column flex-md-row align-items-center gap-5 gap-md-4">
            <RouterLink class="bar__link" v-if="userStore.userData" :to="{name: 'inicio'}" @click="toggleMenu">Inicio</RouterLink>
            <RouterLink class="bar__link" v-if="!userStore.userData" :to="{name: 'registro'}" @click="toggleMenu">Regístrate</RouterLink>
            <RouterLink class="bar__link" v-if="!userStore.userData" :to="{name: 'autenticacion'}" @click="toggleMenu">Iniciar Sesión</RouterLink>
            <RouterLink class="bar__link" v-if="userStore.userData" :to="{name: 'usuario'}" @click="toggleMenu">Usuario</RouterLink>
            <RouterLink class="bar__link" v-if="userStore.userData" :to="{name: 'empresas'}" @click="toggleMenu">Empresas</RouterLink>
        </nav>

        <nav class="bar__btns d-flex flex-column flex-md-row gap-5 gap-md-4">
            <button class="bar__link btn btn-link nav-link" @click="() => {userStore.logout(); toggleMenu()}" v-if="userStore.userData">Salir</button>
            <button class="bar__btn btn btn-link nav-link" @click="downloadGuide"><i class="bar__manual bi bi-question-square ps-md-3"></i></button>
        </nav>
    </div>
</template>