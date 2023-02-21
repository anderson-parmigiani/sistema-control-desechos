<script setup>
import { useUserStore } from '../stores/user';
import { ref } from 'vue';

const userStore = useUserStore();

const name = ref();
const email = ref();
const pass = ref();
const res = ref();
const validate = ref('needs-validation');

const submitData = async () => {
    if(document.querySelector('form').checkValidity()) {
        try {
            res.value = await userStore.createUser(name.value, email.value, pass.value);
            setTimeout(() => {
                userStore.router.push("/autenticacion");
            }, 4000);
        
        } catch (error) {
            res.value = 'Hubo un problema.';
            console.log(error.code, error.message);
        }
    }
    validate.value = 'was-validated';
};
</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col d-none d-sm-block"></div>
            <div class="col">
                <img src="../assets/green.svg" alt="Logo" width="300" height="235" class="mt-5 mx-auto d-none d-xxl-block">
                <img src="../assets/green.svg" alt="Logo" width="250" height="140" class="mt-3 mx-auto d-none d-xl-block d-xxl-none">
                <img src="../assets/green.svg" alt="Logo" width="250" height="127" class="mt-2 mx-auto d-block d-xl-none">
                

                <form :class="`${validate}`" @submit.prevent="submitData" novalidate>
                    <div class="mb-3">
                        <input type="text" class="form-control mt-3 mt-xl-4 mt-xxl-5" placeholder="Nombre de la empresa" v-model.trim="name" required>
                    </div>
                    <div class="mb-3">
                        <input type="email" class="form-control" placeholder="Email" v-model.trim="email" required>
                    </div>
                    <div class="mb-3">
                        <input type="password" class="form-control mb-4" placeholder="Contraseña" v-model.trim="pass" required>
                    </div>
                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary mt-3" :disabled="userStore.loadingUser">Registrarse</button>
                    </div>
                    <div :class="`alert ${res == 'Se ha enviado un correo de verificación.' ? 'alert-success' : 'alert-danger'} mt-4 text-center`" role="alert" v-if="res">{{ res }}</div>
                </form>
            </div>
            <div class="col d-none d-sm-block"></div>
        </div>
    </div>
</template>