<script setup>
import { onMounted, ref } from 'vue';
import { db } from '../firebaseConfig';
import { doc, deleteDoc, getDocs, query, orderBy, where, collection, addDoc, getDoc, updateDoc } from 'firebase/firestore'; 
import { useUserStore } from '../stores/user';
import { useMix } from '../composables/mix';
import { Toast } from 'bootstrap';

const userStore = useUserStore();
const { getDateInfo } = useMix();

const name = ref(null);
const racda = ref(null);
const rif = ref(null);
const nm = ref('');
const rac = ref('');
const rv = ref('');
const validate = ref('needs-validation');
const cargando = ref(false);
const currType = ref(null);
const currID = ref(null);
const typeN = ref(null);
const res = ref();
const msgColor = ref('');
const conf = ref('');
let dTrat = [];
let dTrans = [];

const addItem = async (type, emp) => {
  const getForm = document.querySelector('.fm')
  res.value = '';

  if(name.value !== null && !emp.find((item) => item.name === name.value)){
    nm.value = 'valid';

  }
  else if(name.value == null){
    nm.value = 'invalid';
    showMessage('Ingrese el nombre.', 'text-bg-danger');
    // res.value = 'Ingrese el nombre';
  }
  else{
    nm.value = 'invalid';
    showMessage('La empresa ya existe.', 'text-bg-danger');
    // res.value = 'La empresa ya existe';
  }

  if(rif.value !== null){
    rv.value = 'valid';
  }
  else{
    rv.value='invalid';
  }

  if (racda.value !== null && new Date(racda.value) > Date.now()){
    rac.value = 'valid';
  }
  else if(racda.value !== null && new Date(racda.value) < Date.now()){
    rac.value = 'invalid';
    showMessage('Racda vencido.', 'text-bg-danger');
    // res.value = 'Racda vencido';
  }
  else{
    rac.value = 'invalid';
  }

  if(getForm.checkValidity()) {
    if(name.value !== null && rif.value !== null && racda.value !== null && new Date(racda.value) > Date.now() && !emp.find((item) => item.name === name.value)){
      dTrat.length = 0;
      dTrans.length = 0;
      rac.value = '';
      nm.value = '';
      rv.value = ''
      cargando.value = true;
      const inputData = {name: name.value, rif: rif.value, venc: racda.value, uid: userStore.userData.uid};

      validate.value = 'needs-validation';
      try {
        await addDoc(collection(db, `${type}`), inputData);
        showMessage('Empresa registrada exitosamente.', 'text-bg-success');
        name.value = racda.value = rif.value = null
        await getItems(type)
        cargando.value = false;
      } catch (error) {
        console.log(error.code, error.message);
      }
      cargando.value = false;
    }
    else{
      validate.value = 'was-validated';
    }
  }
  else{
      validate.value = 'was-validated';
  }
}

const getItems = async type => {
  const tabCont = document.getElementById(`${type}`);

  try {
    const q = query(collection(db, `${type}`), where("uid", "==", userStore.userData.uid), orderBy("name"));
    tabCont.innerHTML = '';
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      showData(tabCont, doc.data(), doc.id)
      if(type == 'empTrat'){
        dTrat.push({... doc.data()});
      }
      else if(type = 'empTrans'){
        dTrans.push({... doc.data()});
      }
    });    

    const delIcon = document.querySelectorAll('.bi-trash')
    delIcon.forEach(i => {
      const id = i.parentElement.parentElement.firstElementChild.innerHTML

      const waitConf = () => {
        if(conf.value === ''){
          setTimeout(waitConf, 500)
        }
        else if(conf.value === true){
          i.parentElement.parentElement.remove();
          deleteItem(id, type);
        }
      }

      i.addEventListener("click", waitConf);
    });

    const editIcon = document.querySelectorAll('.bi-pencil')
    editIcon.forEach(i => {
      const id = i.parentElement.parentElement.firstElementChild.innerHTML

      i.addEventListener("click", e => {
        getItemEdit(id, type)
      });
    });

    const racs = document.querySelectorAll('.calc')
    racs.forEach(i => {
      if(new Date(i.textContent) < Date.now()){
        i.nextElementSibling.classList.add("bg-danger-subtle")
      }
      else {
        i.nextElementSibling.classList.add("bg-success-subtle")
      }
    });

  } catch (error) {
    console.log(error.code, error.message);
  }
};

const showMessage = (message, color) => {
  res.value = message;
  msgColor.value = color;
  const toastLiveExample = document.getElementById('liveToast');
  const toast = new Toast(toastLiveExample);
  toast.show();
};

const deleteItem = async (id, type) => {
  try {
    await deleteDoc(doc(db, `${type}`, id));
    showMessage('Empresa eliminada exitosamente.', 'text-bg-success');
  } catch (error) {
    console.log(error.code, error.message);
  };
};

const getItemEdit = async (id, type) => {
  name.value = racda.value = rif.value = currType.value = currID.value = typeN.value = null;

  try {
    const docRef = doc(db, `${type}`, id);
    const docSnap = await getDoc(docRef)

    if(docSnap.exists()) {
      const data = docSnap.data()
      name.value = data.name;
      rif.value = data.rif;
      racda.value = data.venc;
      currType.value = type;
      currID.value = id;
      if(type == 'empTrans'){
        typeN.value = 'Empresa de Transporte';
      }
      else{
        typeN.value = 'Empresa Tratante';
      }
    }

  } catch (error) {
    console.log(error.code, error.message);
  }
}

const edit = async() => {
  const myModal = document.getElementById('disEdit'); 
  res.value = '';

  if(name.value !== null){
    nm.value = 'valid';
  }
  else{
    nm.value ='invalid';
  }

  if(rif.value !== null){
    rv.value = 'valid';
  }
  else{
    rv.value ='invalid';
  }

  if (racda.value !== null && new Date(racda.value) > Date.now()){
    rac.value = 'valid';
  }
  else if(racda.value !== null && new Date(racda.value) < Date.now()){
    rac.value = 'invalid';
    showMessage('Racda vencido.', 'text-bg-danger');
    // res.value = 'Racda vencido';
  }
  else{
    rac.value = 'invalid';
  }

  try {
    if(name.value !== null && name.value !== '' && name.value !== undefined && rif.value !== null && rif.value !== '' && rif.value !== undefined && new Date(racda.value) > Date.now()){
      cargando.value = true;
      const docRef = doc(db, currType.value, currID.value);
      await updateDoc(docRef, {name: name.value, rif: rif.value, venc: racda.value});
      validate.value = 'needs-validation';
      await getItems(currType.value);
      showMessage('Empresa editada exitosamente.', 'text-bg-success');
      name.value = racda.value = rif.value = currType.value = currID.value = null;
      myModal.click();
      cargando.value = false;
    }
    else {
      validate.value = 'was-validated';
    }
  } catch (error) {
    console.log(error.code, error.message);
  }
}

const reset = () => {
  name.value = racda.value = rif.value = currType.value = currID.value = typeN.value = null;
  res.value = '';
}

const showData = (table, data, id) => {
  table.innerHTML += `
                      <tr>
                        <td hidden>${id}</td>
                        <td>J-${data.rif}</td>
                        <td>${data.name}</td>
                        <td class="calc" hidden>${data.venc}</td>
                        <td>${getDateInfo(data.venc)}<i class="bi bi-trash float-end" data-bs-toggle="modal" data-bs-target="#confirmacion" style="cursor: pointer;"></i><i class="bi bi-pencil float-end me-4" style="cursor: pointer;" data-bs-toggle="modal" data-bs-target="#tratEditModal"></i></td>
                      </tr>
                      `
};

const confir = bool => {
  conf.value = bool;
  setTimeout(() => {
    conf.value = ''
  }, 550);
}

onMounted(() => {
  getItems('empTrat');
  getItems('empTrans');
});
</script>

<template>
    <div class="container-xxl">
        <div class="modal fade" id="tratanteModal" tabindex="-1" aria-labelledby="tratanteModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="tratanteModalLabel">Empresa Tratante</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="addItem('empTrat', dTrat)" :class="`row g-3 fm ${validate}`" novalidate>
                    <div class="col-12">
                      <label for="inputNameTrat" class="form-label">Nombre</label>
                      <input type="text" :class="`form-control ${nm}`" id="inputNameTrat" v-model="name" required>
                    </div>
                    <div class="col-6">
                      <label for="inputNameRif" class="form-label">Rif</label>
                      <div class="input-group">
                        <span class="input-group-text">J-</span>
                        <input type="number" :class="`form-control ${rv}`" min="0" max="999999999" oninput="validity.valid||(value='');" id="inputNameRif" v-model="rif" required>
                      </div>
                    </div>
                    <div class="col-6">
                      <label for="inputRacdaTrat" class="form-label">Venc. RACDA</label>
                      <input type="date" :class="`form-control ${rac}`" id="inputRacdaTrat" v-model="racda" required>
                    </div>
                    <!-- <div class="alert alert-danger mt-3 py-1 mb-0 text-center" role="alert" v-if="res">{{ res }}</div> -->
                    <div class="modal-footer">
                        <button v-if = !cargando type="submit" class="btn btn-primary">Registrar</button>
                        <button v-else class="btn btn-primary" type="button" disabled>
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Registrando...
                        </button>
                    </div>
                    </form>
                </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="transporteModal" tabindex="-1" aria-labelledby="transporteModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="transporteModalLabel">Empresa de Transporte</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="addItem('empTrans', dTrans)" :class="`row g-3 fm ${validate}`" novalidate>
                    <div class="col-12">
                        <label for="inputNameTrans" class="form-label">Nombre</label>
                        <input type="text" :class="`form-control ${nm}`" id="inputNameTrans" v-model="name" required>
                    </div>
                    <div class="col-6">
                      <label for="inputNameRif" class="form-label">Rif</label>
                      <div class="input-group">
                        <span class="input-group-text">J-</span>
                        <input type="number" :class="`form-control ${rv}`" min="0" max="999999999" oninput="validity.valid||(value='');" id="inputNameRif" v-model="rif" required>
                      </div>
                    </div>
                    <div class="col-6">
                      <label for="inputRacdaTrans" class="form-label">Venc. RACDA</label>
                      <input type="date" :class="`form-control ${rac}`" id="inputRacdaTrans" v-model="racda" required>
                    </div>
                    <!-- <div class="alert alert-danger mt-3 py-1 mb-0 text-center" role="alert" v-if="res">{{ res }}</div> -->
                    <div class="modal-footer">
                        <button v-if = !cargando type="submit" class="btn btn-primary">Registrar</button>
                        <button v-else class="btn btn-primary" type="button" disabled>
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Registrando...
                        </button>
                    </div>
                    </form>
                </div>

                </div>
            </div>
        </div>

        <div class="modal fade" id="tratEditModal" tabindex="-1" aria-labelledby="tratEditModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="tratEdilModalLabel">{{typeN}}</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="edit" :class="`row g-3 ${validate}`" novalidate>
                    <div class="col-12">
                        <label for="inputNameTrat" class="form-label">Nombre</label>
                        <input type="text" :class="`form-control ${nm}`" id="inputNameTrat" v-model="name" required>
                    </div>
                    <div class="col-6">
                      <label for="inputNameRif" class="form-label">Rif</label>
                      <div class="input-group">
                        <span class="input-group-text">J-</span>
                        <input type="number" :class="`form-control ${rv}`" min="0" max="999999999" oninput="validity.valid||(value='');" id="inputNameRif" v-model="rif" required>
                      </div>
                    </div>
                    <div class="col-6">
                        <label for="inputRacdaTrat" class="form-label">Venc. RACDA</label>
                        <input type="date" :class="`form-control ${rac}`" id="inputRacdaTrat" v-model="racda" required>
                    </div>
                    <!-- <div class="alert alert-danger mt-3 py-1 mb-0 text-center" role="alert" v-if="res">{{ res }}</div> -->
                    <div class="modal-footer">
                        <button v-if = !cargando type="submit" class="btn btn-primary">Editar</button>
                        <button v-else class="btn btn-primary" type="button" disabled>
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Editando...
                        </button>
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal" aria-hidden="true" id="disEdit" hidden></button>
                    </div>
                    </form>
                </div>

                </div>
            </div>
        </div>

        <div class="row mt-4 mt-xxl-5">
            <div class="col-6">
              <div class="overflow-scroll" style="height: 66vh;">
                <table class="table caption-top table-bordered">
                    <caption class="ms-5 ps-5">
                        Empresas Tratantes
                        <button class="btn btn-primary float-end me-2" type="button" @click="reset" data-bs-toggle="modal" data-bs-target="#tratanteModal">
                            Añadir
                        </button>
                    </caption>
                    <thead>
                        <tr>
                          <th scope="col">Rif</th>
                          <th scope="col">Nombre</th>
                          <th scope="col">Vencimiento del Racda</th>
                        </tr>
                    </thead>
                    <tbody id="empTrat" class="table-group-divider"></tbody>
                </table>
              </div>
            </div>
            <div class="col-6">
              <div class="overflow-scroll" style="height: 66vh;">
                <table class="table caption-top table-bordered">
                    <caption class="ms-5 ps-5">
                        Empresas de Transporte
                        <button class="btn btn-primary float-end me-2" type="button" @click="reset" data-bs-toggle="modal" data-bs-target="#transporteModal">
                            Añadir
                        </button>
                    </caption>
                    <thead>
                        <tr>
                          <th scope="col">Rif</th>
                          <th scope="col">Nombre</th>
                          <th scope="col">Vencimiento del Racda</th>
                        </tr>
                    </thead>
                    <tbody id="empTrans" class="table-group-divider"></tbody>
                </table>
              </div>
            </div>
            <div class="d-flex justify-content-center mt-3 mb-2">
              <div class="cuadrado-g rounded-circle"></div>
              <div class="ms-1 pt-1 mt-2">Racda vigente</div>
              <div class="cuadrado-r ms-5 rounded-circle"></div>
              <div class="ms-1 pt-1 mt-2">Racda vencido</div>
            </div>
        </div>

    <div class="modal fade" id="confirmacion" data-bs-backdrop="static" tabindex="-1" aria-labelledby="confimacionLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="confirmacionLabel">Confirmación</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click=confir(false)></button>
          </div>
          <div class="modal-body">
            <p>Se eliminará la empresa.</p>
              <div class="modal-footer">
                <button v-if ="!cargando" type="button" class="btn btn-primary" data-bs-dismiss="modal" aria-label="Close" @click=confir(false)>Cancelar</button>
                <button v-if ="!cargando" type="button" class="btn btn-primary" data-bs-dismiss="modal" aria-label="Close" @click=confir(true)>Aceptar</button>
                <button v-else class="btn btn-primary" type="button" disabled>
                  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
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
          <div :class="`toast-body text-center ${msgColor == 'text-bg-danger' ? 'small' : ''}`">
            {{ res }}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    </div>

    </div>
</template>

<style>
thead {
  background: white;
  position: sticky;
  top: -1px;
  z-index: 999;
}

.cuadrado-g {
  width: 50px;
  height: 50px;
  background-color: #d1e7dd;
}

.cuadrado-r {
  width: 50px;
  height: 50px;
  background-color: #f8d7da;
}
</style>