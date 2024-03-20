<script setup lang="ts">
import {useUserStore} from '../stores/user';
import {useMix} from '../composables/mix';
import {ref} from 'vue';
import {db, storage} from '../firebaseConfig';
import {ref as fileRef, uploadBytes, getDownloadURL} from 'firebase/storage';
import {doc, setDoc} from "firebase/firestore"; 

const userStore = useUserStore();
const {res, timer} = useMix();

const image = ref(null);
const email = ref(userStore.userData.email);
const name = ref(userStore.userData.name);
const expDate = ref(userStore.userData.expDate);
const validate = ref('needs-validation');

const submitData = async () => {
    try {
        if(!(document.querySelector('form')).checkValidity()) throw new Error('Complete los campos correctamente.');
        res.value = await userStore.updateName(name.value);
        await associateRacda();
    } catch (e) {
        res.value = e.message;
    } finally {
        validate.value = 'was-validated';
        timer(res, 5000);
    }
};

const selectPhoto = async e => {
    try {
        image.value = e.target.files[0];
        await uploadPhoto();
    } catch (e) {
        res.value = e.message;
    }
};

const uploadPhoto = async () => {
    try {
        if(!image.value) throw new Error('Seleccione una imagen.');
        const storageRef = fileRef(storage, `images/users/${image.value.name}`);
        const metaData = { contentType: 'image/png'};
        await uploadBytes(storageRef, image.value, metaData);
        await loadPhoto();
    } catch (e) {
        res.value = e.message;
    }
};

const loadPhoto = async () => {
    try {
        const url = await getDownloadURL(fileRef(storage, `images/users/${image.value.name}`));
        await associatePhoto(url);
        await userStore.updatePhoto(url);
    } catch (e) {
        res.value = e.message;
    }
};

const associatePhoto = async url => {
    try {
        const docRef = doc(db, "user", userStore.userData.uid);
        await setDoc(docRef, {
            url
        }, { merge: true });
    } catch (e) {
        res.value = e.message;
    }
};

const associateRacda = async () => {
    try {
        const docRef = doc(db, "user", userStore.userData.uid);
        await setDoc(docRef, {
            expDate: expDate.value
        }, { merge: true });

        userStore.userData = {...userStore.userData, expDate: expDate.value};
        userStore.racdaAlert();
    } catch (e) {
        res.value = e.message;
    }
};
</script>

<template>

    <main class="authentication container my-auto">

        <form class="authentication__form mx-auto" enctype="multipart/form-data" @submit.prevent="submitData" novalidate>
            <fieldset class="authentication__content d-flex flex-column justify-content-center align-items-center">
                <legend class="authentication__legend text-center w-100 mb-0">Usuario</legend>

                <div class="authentication__profile-photo">
                    <label class="authentication__profile-label" for="inputImg">
                        <img class="authentication__profile-img rounded-circle" :src= userStore.userData?.photo id="userImg" alt="Logo" width="200" height="130">
                    </label>
                    <input class="authentication__profile-hidden form-control" type="file" id="inputImg" accept="image/*" @change="selectPhoto($event)">
                </div>

                <div :class="`authentication__field d-flex align-items-center mb-5 w-100 ${validate}`">
                    <label class="authentication__label me-3 me-sm-0" for="email">Email: </label>
                    <input class="authentication__input form-control py-2" type="email" id="email" placeholder="email@example.com" v-model.trim="email" disabled required>
                </div>

                <div :class="`authentication__field d-flex align-items-center mb-5 w-100 ${validate}`">
                    <label class="authentication__label me-3 me-sm-0" for="name">Nombre: </label>
                    <input class="authentication__input form-control py-2" type="text" id="name" placeholder="Empresa C.A." v-model.trim="name" required>
                </div>

                <div :class="`authentication__field d-flex align-items-center mb-5 w-100 ${validate}`">
                    <label class="authentication__label me-3 me-sm-0" for="date">Vencimiento del RACDA: </label>
                    <input class="authentication__input form-control py-2" type="date" id="date" v-model.trim="expDate" required>
                </div>

                <div class="authentication__btn d-flex justify-content-end">
                    <button class="authentication__submit authentication__submit--registro" type="submit" :disabled="userStore.loadingUser">Actualizar</button>
                </div>

                <RouterLink class="authentication__recover mt-5 mb-3" to="/recuperacion">¿Desea cambiar la contraseña?</RouterLink>
            </fieldset>

            <div :class="`authentication__alert alert ${res == 'Informacion actualizada.' ? 'alert-success' : 'alert-danger'} text-center mx-auto mt-2 mt-md-5`" role="alert" v-if="res">{{res}}</div>
        </form>

    </main>

</template>