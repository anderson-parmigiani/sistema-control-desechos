<script setup lang="ts">
import { useUserStore } from '../stores/user';
import { useMix } from '../composables/mix';
import { ref } from 'vue';

const userStore = useUserStore();
const { res, timer } = useMix();

const email = ref(localStorage.getItem('email'));
const pass = ref();
const checked = ref();
const validate = ref('needs-validation');
const local = localStorage.getItem('email');


const submitData = async () => {
    try {
        if(!document.querySelector('form').checkValidity()) throw new Error('Complete los campos correctamente.');
        res.value = await userStore.login(email.value, pass.value);
        remember();
    } catch (e) {
        res.value = e.message;
    } finally {
        validate.value = 'was-validated';
        timer(res, 5000);
    }
};

const remember = () => {
    if (checked.value === true || checked.value === undefined && local) {
        localStorage.setItem('email', email.value);
    } else if (checked.value === false || checked.value === undefined && !local) {
        localStorage.removeItem('email');
    }
};
</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col d-none d-sm-block"></div>
            <div class="col">
                <img src="../assets/green.svg" alt="Logo" width="300" height="240" class="mt-5 mx-auto d-none d-xxl-block">
                <img src="../assets/green.svg" alt="Logo" width="250" height="140" class="mt-3 mx-auto d-none d-xl-block d-xxl-none">
                <img src="../assets/green.svg" alt="Logo" width="250" height="127" class="mt-2 mx-auto d-block d-xl-none">

                <form class="mt-5" @submit.prevent="submitData" novalidate>
                    <div :class="`mb-3 ${validate}`">
                        <input type="email" class="form-control mt-3 mt-xl-4 mt-xxl-5" placeholder="Email" v-model.trim="email" required>
                    </div>
                    <div :class="`mb-3 ${validate}`">
                        <input type="password" class="form-control mb-4" placeholder="Contraseña" v-model.trim="pass" required>
                    </div>
                    <div class="row mb-4">
                        <div class="col-5 d-flex justify-content-center">
                            <div class="form-check">
                                <input class="form-check-input mt-2" type="checkbox" id="checkbox" v-model="checked" :checked=Boolean(local)>
                                <label class="form-check-label mt-1" for="checkbox">Recuérdame</label>
                            </div>
                        </div>
                        <div class="col-7">
                            <button type="button" class="btn btn-link py-0 py-xl-1"><RouterLink to="/recuperacion">¿Olvidaste la contraseña?</RouterLink></button>
                        </div>
                    </div>
                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary mb-3 mb-sm-4 mt-1 mt-xl-3" :disabled="userStore.loadingUser">Entrar</button>
                    </div>
                    <div class="text-center">
                        <p>¿No eres un usuario? <RouterLink to="/registro">Regístrate</RouterLink></p>
                    </div>
                </form>
                <div :class="`alert alert-danger mt-4 text-center`" role="alert" v-if="res">{{ res }}</div>
            </div>
            <div class="col d-none d-sm-block"></div>
        </div>
    </div>
</template>