<script setup lang="ts">
import {useUserStore} from '../stores/user';
import {useMix} from '../composables/mix';
import {ref} from 'vue';

const userStore = useUserStore();
const {res, timer} = useMix();

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
    if (checked.value === true || checked.value === undefined && local) 
        localStorage.setItem('email', email.value);
    else if (checked.value === false || checked.value === undefined && !local)
        localStorage.removeItem('email');
};
</script>

<template>
    <main class="authentication container my-auto">

        <form class="authentication__form  mx-auto" @submit.prevent="submitData" novalidate>
            <fieldset class="authentication__content d-flex flex-column justify-content-center align-items-center">
                <legend class="authentication__legend text-center w-100">Ingreso</legend>

                <div :class="`authentication__field d-flex align-items-center mb-5 w-100 ${validate}`">
                    <label class="authentication__label me-3 me-sm-0" for="email">Email: </label>
                    <input class="authentication__input form-control py-2" type="email" id="email" placeholder="email@example.com" v-model.trim="email" required>
                </div>

                <div :class="`authentication__field d-flex align-items-center mb-5 w-100 ${validate}`">
                    <label class="authentication__label me-3 me-sm-0" for="password">Contraseña: </label>
                    <input class="authentication__input form-control py-2" type="password" id="password" placeholder="·················" v-model.trim="pass" required>
                </div>

                <div class="authentication__remember d-flex justify-content-between align-items-center">
                    <div class="authentication__check form-check">
                        <label class="authentication__check-label form-check-label" for="checkbox">Recuérdame</label>
                        <input class="authentication__check-input form-check-input" type="checkbox" id="checkbox" v-model="checked" :checked=Boolean(local)>
                    </div>

                    <button class="authentication__submit w-50" type="submit" :disabled="userStore.loadingUser">Entrar</button>
                </div>

                <RouterLink class="authentication__recover mt-5" to="/recuperacion">¿Olvidaste la contraseña?</RouterLink>

                <p class="authentication__register mt-4">¿No eres un usuario? <RouterLink class="autenticacion__register-link" to="/registro">Regístrate</RouterLink></p>
            </fieldset>

            <div class="authentication__alert alert alert-danger text-center mx-auto mt-2 mt-md-5" role="alert" v-if="res">{{res}}</div>
        </form>

    </main>
</template>