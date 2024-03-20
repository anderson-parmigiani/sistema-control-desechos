<script setup lang="ts">
import {useUserStore} from '../stores/user';
import {useMix} from '../composables/mix';
import {ref} from 'vue';

const userStore = useUserStore();
const {res, timer} = useMix();

const email = ref();
const validate = ref('needs-validation');

const changePassword = async () => {
    try {
        if(!document.querySelector('form').checkValidity()) throw new Error('Ingrese el email correctamente.');
        res.value = await userStore.changePass(email.value);
        timer(res, 7000);

        if(userStore.auth.currentUser && res.value === 'Se ha enviado un correo.'){
            setTimeout(() => {
                userStore.logout();
            }, 7000);
        }
    } catch (e) {
        res.value = e.message;
        timer(res, 5000);
    } finally {
        validate.value = 'was-validated';
    }
};
</script>

<template>

    <main class="authentication container my-auto">

        <form class="authentication__form mx-auto" @submit.prevent="changePassword" novalidate>
            <fieldset class="authentication__content d-flex flex-column justify-content-center align-items-center">
                <legend class="authentication__legend text-center w-100">Recuperación</legend>

                <div :class="`authentication__field d-flex align-items-center mb-5 w-100 ${validate}`">
                    <label class="authentication__label me-3 me-sm-0" for="email">Email: </label>
                    <input class="authentication__input form-control py-2" type="email" id="email" placeholder="email@example.com" v-model.trim="email" required>
                </div>

                <div class="authentication__btn d-flex justify-content-end">
                    <button class="authentication__submit authentication__submit--registro mb-3" type="submit" :disabled="userStore.loadingUser">Recuperar</button>
                </div>
            </fieldset>

            <div :class="`authentication__alert alert ${res == 'Se ha enviado un correo.' ? 'alert-success' : 'alert-danger'} text-center mx-auto mt-5`" role="alert" v-if="res">{{res}}</div>
        </form>

    </main>

</template>