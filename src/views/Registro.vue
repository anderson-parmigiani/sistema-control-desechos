<script setup lang="ts">
import {useUserStore} from '../stores/user';
import {useMix} from '../composables/mix';
import {ref} from 'vue';

const userStore = useUserStore();
const {res, timer} = useMix();

const name = ref();
const email = ref();
const pass = ref();
const validate = ref('needs-validation');

const submitData = async () => {
    try {
        if(!document.querySelector('form').checkValidity()) throw new Error('Llene los campos correctamente.');    
        res.value = await userStore.createUser(name.value, email.value, pass.value);
        setTimeout(() => {
            userStore.router.push("/autenticacion");
        }, 4000);
    } catch (e) {
        res.value = e.message;
    } finally {
        validate.value = 'was-validated';
        timer(res, 5000);
    }
};
</script>

<template>
    <main class="authentication container my-auto">

        <form class="authentication__form mx-auto" @submit.prevent="submitData" novalidate>
            <fieldset class="authentication__content d-flex flex-column justify-content-center align-items-center">
                <legend class="authentication__legend text-center w-100">Registro</legend>

                <div :class="`authentication__field d-flex align-items-center mb-5 w-100 ${validate}`">
                    <label class="authentication__label me-3 me-sm-0" for="name">Nombre: </label>
                    <input class="authentication__input form-control py-2" type="text" id="name" placeholder="Empresa C.A." v-model.trim="name" required>
                </div>

                <div :class="`authentication__field d-flex align-items-center mb-5 w-100 ${validate}`">
                    <label class="authentication__label me-3 me-sm-0" for="email">Email: </label>
                    <input class="authentication__input form-control py-2" type="email" id="email" placeholder="email@example.com" v-model.trim="email" required>
                </div>

                <div :class="`authentication__field d-flex align-items-center mb-5 w-100 ${validate}`">
                    <label class="authentication__label me-3 me-sm-0" for="password">Contraseña: </label>
                    <input class="authentication__input form-control py-2" type="password" id="password" placeholder="·················" v-model.trim="pass" required>
                </div>

                <div class="authentication__btn d-flex justify-content-end">
                    <button class="authentication__submit authentication__submit--registro mb-3" type="submit" :disabled="userStore.loadingUser">Registrarse</button>
                </div>
            </fieldset>

            <div :class="`authentication__alert alert ${res == 'Se ha enviado un correo de verificación.' ? 'alert-success' : 'alert-danger'} text-center mx-auto mt-2 mt-md-5`" role="alert" v-if="res">{{res}}</div>
        </form>

    </main>
</template>