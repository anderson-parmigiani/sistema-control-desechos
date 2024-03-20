<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {db} from '../firebaseConfig';
import {doc, deleteDoc, getDocs, query, orderBy, where, collection, addDoc, getDoc, updateDoc} from 'firebase/firestore'; 
import {useUserStore} from '../stores/user';
import {useMix} from '../composables/mix';

const userStore = useUserStore();
const {getDateInfo, showMessage, res, msgColor} = useMix();

const name = ref(null);
const racda = ref(null);
const rif = ref(null);
const currType = ref(null);
const currID = ref(null);
const typeN = ref(null);
const tel = ref(null);
const email = ref(null);
const cargando = ref(false);
const id = ref('');
const tratName = ref('');
const transName = ref('');
const validate = ref('needs-validation');
const dTrat = ref([]);
const dTrans = ref([]);
const typeModal = ref('');
let pvTratSearch = [], pvTransSearch = [];
let resulTrt = {};

const addItem = async (type, emp) => { // validación de campos al intentar registrar una nueva empresa,
  try {                                // registro en la base de datos y luego en un arreglo local.
    const getForm = document.querySelector('.fm');
    validate.value = 'needs-validation';
    messagesVal();

    if(emp.find(item => item.name === name.value) || emp.find(item => item.rif === rif.value))
      showMessage('La empresa ya existe.', 'text-bg-danger');

    if(!(getForm as HTMLSelectElement).checkValidity() 
      || !(rif.value.toString().length === 9 && new Date(racda.value).getTime() > Date.now() && !emp.find(item => item.name === name.value) && !emp.find(item => item.rif === rif.value))){
          validate.value = 'was-validated';
          throw new Error('El formulario no se ha completado correctamente.');
    };

    const inputData = {name: name.value, rif: rif.value, venc: racda.value, tel: tel.value, email: email.value, uid: userStore.userData.uid};
    cargando.value = true;

    const docRef = await addDoc(collection(db, type), inputData); // registro en la base de datos.
    showMessage('Empresa registrada exitosamente.', 'text-bg-success');
    name.value = racda.value = rif.value = tel.value = email.value = null;
    emp.push({... inputData, id: docRef.id}); // registro en arreglo local.
    emp.sort((a, b) => { // se ordena el arreglo en orden alfabetico de la propiedad nombre de los objetivos.
      let fa = a.name.toLowerCase(),
          fb = b.name.toLowerCase();

      if(fa < fb)
        return -1;
      
      if(fa > fb)
        return 1;
      
      return 0;
    });
    cargando.value = false;
  } catch (e) {
    console.log(e.message);
  }
};

const getItems = async type => { // consulta a la base de datos para traer las empresas registradas y luego registrarlas en un arreglo local.
  try {
    const q = query(collection(db, type), where("uid", "==", userStore.userData.uid), orderBy("name"));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => {
      type === 'empTrat'
       ? dTrat.value.push({... doc.data(), id: doc.id})
       : dTrans.value.push({... doc.data(), id: doc.id});
    });    
  } catch (e) {
    console.log(e.message);
  }
};

const searchTrt = type => { // busca en el arreglo local si existe la empresa indicada.
  if(pvTratSearch.length !== 0 && type === 'empTrat')
    dTrat.value = [...pvTratSearch];
  else if(pvTransSearch.length !== 0 && type === 'empTrans')
    dTrans.value = [...pvTransSearch];

  if(type === 'empTrat')
    resulTrt = dTrat.value.find(i => i.name.toLowerCase().replace(/\s+/g, '') == tratName.value.toLowerCase().replace(/\s+/g, ''));
  else
    resulTrt = dTrans.value.find(i => i.name.toLowerCase().replace(/\s+/g, '') == transName.value.toLowerCase().replace(/\s+/g, ''));

  if(resulTrt){
    type === 'empTrat' ? pvTratSearch = [...dTrat.value] : pvTransSearch = [...dTrans.value];
    type === 'empTrat' ? dTrat.value = [resulTrt] : dTrans.value = [resulTrt];
  }
};

const deleteItem = async (id, type) => { // elimina empresa del arreglo local y de la base de datos
  try {
    if(type === 'empTrat'){
      const delObj = dTrat.value.findIndex(i => i.id === id);
      dTrat.value.splice(delObj, 1);
    } else {
      const delObj = dTrans.value.findIndex(i => i.id === id);
      dTrans.value.splice(delObj, 1);
    }

    await deleteDoc(doc(db, `${type}`, id));
    showMessage('Empresa eliminada exitosamente.', 'text-bg-success');
  } catch (e) {
    console.log(e.message);
  }
};

const getItemEdit = async (id, type) => { // trae información de una empresa ya registrada en la base de datos
  try {
    name.value = racda.value = rif.value = currType.value = currID.value = typeN.value = tel.value = email.value = null;
    const docRef = doc(db, type, id);
    const docSnap = await getDoc(docRef);

    if(docSnap.exists()) {
      const data = docSnap.data();
      name.value = data.name;
      rif.value = data.rif;
      racda.value = data.venc;
      tel.value = data.tel;
      email.value = data.email;
      currType.value = type;
      currID.value = id;
      if(type === 'empTrans')
       typeN.value = 'Empresa de Transporte';
      else
       typeN.value = 'Empresa Tratante';
    }
  } catch (e) {
    console.log(e.message);
  }
};

const edit = async() => { // valida campos al intentar editar, edita la empresa en la base de datos y en el arreglo local.
  try {
    const myModal = document.getElementById('disEdit');
    messagesVal();
    
    if(name.value && rif.value && new Date(racda.value).getTime() > Date.now() && tel.value && email.value){
      cargando.value = true;
      const docRef = doc(db, currType.value, currID.value);
      await updateDoc(docRef, {name: name.value, rif: rif.value, venc: racda.value, tel: tel.value, email: email.value}); // edita en la base de datos.
      validate.value = 'needs-validation';

      if(currType.value === 'empTrat'){ // edita en el arreglo local.
        const updObj = dTrat.value.findIndex(i => i.id === currID.value);
        dTrat.value[updObj] = {...dTrat.value[updObj], name: name.value, rif: rif.value, venc: racda.value, tel: tel.value, email: email.value};
      } else {
        const updObj = dTrans.value.findIndex(i => i.id === currID.value);
        dTrans.value[updObj] = {...dTrans.value[updObj], name: name.value, rif: rif.value, venc: racda.value, tel: tel.value, email: email.value};
      }
    
      showMessage('Empresa editada exitosamente.', 'text-bg-success');
      name.value = racda.value = rif.value = tel.value = email.value = currType.value = currID.value = null;
      myModal.click();
      cargando.value = false;
    } else {
      validate.value = 'was-validated';
    }
  } catch (e) {
    console.log(e.message);
  }
};

const prepare = type => { // elimina valores guardados en las variables
  name.value = racda.value = rif.value = tel.value = email.value = currType.value = currID.value = typeN.value = null;
  typeModal.value = type;
};

const messagesVal = () => { // emite mensajes segun el valor de las variables
  if(!name.value)
    showMessage('Ingrese el nombre.', 'text-bg-danger');

  if(!rif.value)
    showMessage('Ingrese el rif.', 'text-bg-danger');
  else if(rif.value.toString().length !== 9)
    showMessage('El rif debe tener 9 dígitos.', 'text-bg-danger');

  if(!racda.value)
    showMessage('Ingrese Racda.', 'text-bg-danger');
  else if(new Date(racda.value).getTime() < Date.now())
    showMessage('Racda vencido.', 'text-bg-danger');

  if(!tel.value)
    showMessage('Ingrese el teléfono correctamente.', 'text-bg-danger');

  if(!email.value)
    showMessage('Ingrese el email.', 'text-bg-danger');
};

onMounted(() => {
  getItems('empTrat');
  getItems('empTrans');
});
</script>

<template>

  <main class="main container d-flex flex-column gap-5 mt-5 pt-3 pt-lg-5">

    <div class="d-flex justify-content-between align-items-center">
      <p class="main__emp-type mb-0">Tratamiento</p>
      <div class="authentication__field">
        <input class="authentication__input authentication__input--empresa form-control" type="text" placeholder="Buscar nombre" id="searchTrat" v-model="tratName" @keyup.enter="searchTrt('empTrat')">
      </div>
      <button class="main__new-btn main__new-btn--empresa" type="button" @click="prepare('Empresa Tratante')" data-bs-toggle="modal" data-bs-target="#modalRegistro">Añadir</button>
    </div>
    
    <div class="main__table d-flex flex-column">
      <table class="main__table-content">

        <thead class="main__thead">
          <tr>
            <th class="main__th" scope="col">Rif</th>
            <th class="main__th" scope="col">Nombre</th>
            <th class="main__th" scope="col">V. Racda</th>
          </tr>
        </thead>

        <tbody class="main__tbody" id="empTrat">
          <tr v-for="emp in dTrat" :key="emp.id">
            <td class="main__tbody-td"><span class="d-none d-sm-inline-block">J-</span>{{emp.rif}}</td>
            <td class="main__tbody-td">{{emp.name}}</td>
            <td :class="new Date(emp.venc).getTime() < Date.now() ? 'bg-danger-subtle d-flex justify-content-between' : 'bg-success-subtle d-flex justify-content-between'" @click="() => {id = emp.id; currType = 'empTrat'}">
              {{getDateInfo(emp.venc)}}
                <div class="main__tbody-icons">
                  <i class="bi bi-trash me-2 me-sm-3 me-lg-4" data-bs-toggle="modal" data-bs-target="#confirmacion" style="cursor: pointer;"></i>
                  <i class="bi bi-pencil me-2 me-sm-3 me-lg-4" @click="getItemEdit(emp.id, 'empTrat')" style="cursor: pointer;" data-bs-toggle="modal" data-bs-target="#editModal"></i>
                  <i class="bi bi-eye me-2 me-sm-3" @click="getItemEdit(emp.id, 'empTrat')" style="cursor: pointer;" data-bs-toggle="modal" data-bs-target="#infoModal"></i>
                </div>
            </td>
          </tr>
        </tbody>

      </table>
    </div>

    <div class="d-flex justify-content-between align-items-center">
      <p class="main__emp-type mb-0">Transporte</p>
      <div class="authentication__field">
        <input class="authentication__input authentication__input--empresa form-control" type="text" placeholder="Buscar nombre" id="searchTrans" v-model="transName" @keyup.enter="searchTrt('empTrans')">
      </div>
      <button class="main__new-btn main__new-btn--empresa" type="button" @click="prepare('Empresa de Transporte')" data-bs-toggle="modal" data-bs-target="#modalRegistro">Añadir</button>
    </div>

    <div class="main__table d-flex flex-column">
      <table class="main__table-content">

        <thead class="main__thead">
          <tr>
            <th class="main__th" scope="col">Rif</th>
            <th class="main__th" scope="col">Nombre</th>
            <th class="main__th" scope="col">V. Racda</th>
          </tr>
        </thead>

        <tbody class="main__tbody" id="empTrans">
          <tr v-for="emp in dTrans" :key="emp.id">
            <td class="main__tbody-td"><span class="d-none d-sm-inline-block">J-</span>{{emp.rif}}</td>
            <td class="main__tbody-td">{{emp.name}}</td>
            <td :class="new Date(emp.venc).getTime() < Date.now() ? 'bg-danger-subtle d-flex justify-content-between' : 'bg-success-subtle d-flex justify-content-between'" @click="() => {id = emp.id; currType = 'empTrans'}">
              {{getDateInfo(emp.venc)}}
              <div class="main__tbody-icons">
                <i class="bi bi-trash me-2 me-sm-3 me-lg-4" data-bs-toggle="modal" data-bs-target="#confirmacion" style="cursor: pointer;"></i>
                <i class="bi bi-pencil me-2 me-sm-3 me-lg-4" @click="getItemEdit(emp.id, 'empTrans')" style="cursor: pointer;" data-bs-toggle="modal" data-bs-target="#editModal"></i>
                <i class="bi bi-eye me-1 me-2 me-sm-3" @click="getItemEdit(emp.id, 'empTrans')" style="cursor: pointer;" data-bs-toggle="modal" data-bs-target="#infoModal"></i>
              </div>
            </td>
          </tr>
        </tbody>

      </table>
    </div>

    <div class="d-flex justify-content-center align-items-center gap-5 mt-3 mb-4">
      <div class="main__circle d-flex justify-content-center align-items-center gap-3">
        <div class="main__circle-g rounded-circle"></div>
        <p class="mb-0">Racda vigente</p>
      </div>
      <div class="main__circle d-flex justify-content-center align-items-center gap-3">
        <div class="main__circle-r rounded-circle"></div>
        <p class="mb-0">Racda vencido</p>
      </div>
    </div>

    <div class="modal fade" id="modalRegistro" tabindex="-1" aria-labelledby="modalRegistroLabel" aria-hidden="true">
      <div class="modal__emp modal-dialog modal-dialog-centered">
        <div class="modal__emp-content modal-content">
          <div class="modal__emp-header modal-header">
            <h1 class="modal__emp-title modal-title" id="modalRegistroLabel">{{typeModal}}</h1>
            <button class="modal__emp-close btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form :class="`${validate}`" @submit.prevent="addItem(typeModal === 'Empresa Tratante' ? 'empTrat' : 'empTrans', typeModal === 'Empresa Tratante' ? dTrat : dTrans)" novalidate>
              <div class="mb-4">
                <label class="form-label" for="inputNameTrat">Nombre</label>
                <input class="modal__input form-control" type="text" id="inputNameTrat" v-model="name" placeholder="Empresa C.A." required>
              </div>
              <div class="mb-4">
                <label for="inputNameRif" class="form-label">Rif</label>
                <div class="input-group">
                  <span class="modal__rif-span input-group-text">J-</span>
                  <input class="modal__input form-control" type="number" min="0" max="999999999" oninput="validity.valid||(value='');" id="inputNameRif" placeholder="123456789" v-model="rif" required>
                </div>
              </div>
              <div class="mb-4">
                <label for="inputRacdaTrat" class="form-label">Venc. Racda</label>
                <input class="modal__input form-control" type="date" id="inputRacdaTrat" placeholder="" v-model="racda" required>
              </div>
              <div class="mb-4">
                <label for="inputTelTrat" class="form-label">Teléfono</label>
                <input class="modal__input form-control" type="tel" pattern="[0-9]{4}-[0-9]{7}" placeholder="0424-4567890" id="inputTelTrat" v-model="tel" required>
              </div>
              <div class="mb-4">
                <label for="inputEmailTrat" class="form-label">Email</label>
                <input class="modal__input form-control" type="email" id="inputEmailTrat" placeholder="email@example.com" v-model.trim="email" required>
              </div>
              <div class="modal__new-footer modal__emp-footer modal-footer">
                <button class="modal__new-btn" v-if=!cargando type="submit">Registrar</button>
                <button class="modal__new-btn d-flex align-items-center justify-content-center" v-else type="button" disabled>
                <span class="modal__new-loading spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Registrando...
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="editModal" tabindex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
      <div class="modal__emp modal-dialog modal-dialog-centered">
        <div class="modal__emp-content modal-content">
          <div class="modal__emp-header modal-header">
            <h1 class="modal__emp-title modal-title" id="editModalLabel">{{typeN}}</h1>
            <button class="modal__emp-close btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form :class="`${validate}`" @submit.prevent="edit" novalidate>
              <div class="mb-4">
                <label class="form-label" for="inputNameEdit">Nombre</label>
                <input class="modal__input form-control" type="text" id="inputNameEdit" v-model="name" required>
              </div>
              <div class="mb-4">
                <label class="form-label" for="inputNameRif">Rif</label>
                <div class="input-group">
                  <span class="modal__rif-span input-group-text">J-</span>
                  <input class="modal__input form-control" type="number" min="0" max="999999999" oninput="validity.valid||(value='');" id="inputNameRif" v-model="rif" required>
                </div>
              </div>
              <div class="mb-4">
                <label class="form-label" for="inputRacdaTrat">Venc. Racda</label>
                <input class="modal__input form-control" type="date" id="inputRacdaTrat" v-model="racda" required>
              </div>
              <div class="mb-4">
                <label class="form-label" for="inputTel">Teléfono</label>
                <input class="modal__input form-control" type="tel" id="inputTel" pattern="[0-9]{4}-[0-9]{7}" placeholder="0424-4567890" v-model="tel" required>
              </div>
              <div class="mb-4">
                <label class="form-label" for="inputEmail">Email</label>
                <input class="modal__input form-control" type="email" id="inputEmail" v-model.trim="email" required>
              </div>
              <div class="modal__new-footer modal__emp-footer modal-footer">
                <button class="modal__new-btn" v-if = !cargando type="submit">Editar</button>
                <button class="modal__new-btn d-flex align-items-center justify-content-center" v-else type="button" disabled>
                <span class="modal__new-loading spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Editando...
                </button>
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal" aria-hidden="true" id="disEdit" hidden></button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="infoModal" tabindex="-1" aria-labelledby="infoModalLabel" aria-hidden="true">
      <div class="modal__emp modal-dialog modal-dialog-centered">
        <div class="modal__emp-content modal-content">
          <div class="modal__emp-header modal-header">
            <h1 class="modal__emp-title modal-title" id="infoModalLabel">{{typeN}}</h1>
            <button class="modal__emp-close btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form :class="`${validate}`" @submit.prevent novalidate>
              <div class="mb-4">
                <label class="form-label" for="inputNameInfo">Nombre</label>
                <input class="modal__input form-control" type="text" id="inputNameInfo" v-model="name" readonly required>
              </div>
              <div class="mb-4">
                <label class="form-label" for="inputNameRif">Rif</label>
                <div class="input-group">
                  <span class="modal__rif-span input-group-text">J-</span>
                  <input class="modal__input form-control" type="number" min="0" max="999999999" oninput="validity.valid||(value='');" id="inputNameRif" v-model="rif" readonly required>
                </div>
              </div>
              <div class="mb-4">
                <label class="form-label" for="inputRacda">Venc. Racda</label>
                <input class="modal__input form-control" type="date" id="inputRacda" v-model="racda" readonly required>
              </div>
              <div class="mb-4">
                <label class="form-label" for="inputTel">Teléfono</label>
                <input class="modal__input form-control" type="tel" id="inputTel" pattern="[0-9]{4}-[0-9]{7}" v-model="tel" readonly required>
              </div>
              <div class="mb-4">
                <label class="form-label" for="inputEmail">Email</label>
                <input class="modal__input form-control" type="email" id="inputEmail" v-model.trim="email" readonly required>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="confirmacion" data-bs-backdrop="static" tabindex="-1" aria-labelledby="confimacionLabel" aria-hidden="true">
      <div class="modal__delete modal-dialog modal-dialog-centered">
        <div class="modal__delete-content modal-content">
          <div class="modal__delete-header modal-header">
            <h1 class="modal__delete-title modal-title ps-3" id="confirmacionLabel">Confirmación</h1>
            <button class="modal__delete-close btn-close me-2" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal__delete-body modal-body">
            <p class="ps-3">Se eliminará la empresa.</p>
            <div class="modal__delete-footer modal-footer">
              <button class="modal__delete-btn" v-if ="!cargando" type="button" data-bs-dismiss="modal" aria-label="Close">Cancelar</button>
              <button class="modal__delete-btn" v-if ="!cargando" type="button" @click="deleteItem(id, currType)" data-bs-dismiss="modal" aria-label="Close">Aceptar</button>
              <button class="modal__delete-btn d-flex align-items-center justify-content-center" v-else type="button" disabled>
                <span class="modal__delete-loading spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Eliminando...
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="toast-container position-fixed top-0 start-50 translate-middle-x p-3">
      <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div :class="`d-flex ${msgColor}`">
          <div class="toast-body text-center">
            {{res}}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    </div>

  </main>

</template>