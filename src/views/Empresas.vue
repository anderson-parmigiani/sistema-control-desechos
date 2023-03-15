<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { db } from '../firebaseConfig';
import { doc, deleteDoc, getDocs, query, orderBy, where, collection, addDoc, getDoc, updateDoc } from 'firebase/firestore'; 
import { useUserStore } from '../stores/user';
import { useMix } from '../composables/mix';
import { Toast } from 'bootstrap';

const userStore = useUserStore();
const { getDateInfo, iconsFunc } = useMix();

const name = ref(null);
const racda = ref(null);
const rif = ref(null);
const currType = ref(null);
const currID = ref(null);
const typeN = ref(null);
const tel = ref(null);
const email = ref(null);
const cargando = ref(false);
const tratName = ref('');
const transName = ref('');
const nm = ref('');
const rac = ref('');
const rv = ref('');
const msgColor = ref('');
const conf = ref('');
const res = ref();
const validate = ref('needs-validation');

interface iEmp {
  name?: string; 
  rif?: number; 
  venc?: string; 
  tel?: string; 
  email?: string; 
  uid?: string;
  id?: string;
}

let dTrat: iEmp[] = [], dTrans: iEmp[] = [];

const addItem = async (type, emp) => {
  try {
    const tabCont = document.getElementById(`${type}`);
    const getForm = document.querySelector('.fm');
    res.value = '';

    if(name.value && !emp.find(item => item.name === name.value)){
      nm.value = 'valid';
    } else if(!name.value){
      showMessage('Ingrese el nombre.', 'text-bg-danger');
      nm.value = 'invalid';
    } else {
      nm.value = 'invalid';
    }

    if(rif.value && rif.value.toString().length === 9 && !emp.find(item => item.rif === rif.value)){
      rv.value = 'valid';
    } else if(rif.value && rif.value.toString().length !== 9){
      showMessage('El rif debe tener 9 dígitos.', 'text-bg-danger');
      rv.value='invalid';
    } else if(!rif.value){
      showMessage('Ingrese el rif.', 'text-bg-danger');
    } else {
      rv.value='invalid';
    }

    if(emp.find(item => item.name === name.value) || emp.find(item => item.rif === rif.value))
      showMessage('La empresa ya existe.', 'text-bg-danger');

    if(racda.value && new Date(racda.value).getTime() > Date.now()){
      rac.value = 'valid';
    } else if(racda.value && new Date(racda.value).getTime() < Date.now()){
      showMessage('Racda vencido.', 'text-bg-danger');
      rac.value = 'invalid';
    } else {
      showMessage('Ingrese Racda.', 'text-bg-danger');
      rac.value = 'invalid';
    }

    if(!tel.value)
      showMessage('Ingrese el teléfono correctamente.', 'text-bg-danger');

    if(!email.value)
      showMessage('Ingrese el email.', 'text-bg-danger');

    if((getForm as HTMLSelectElement).checkValidity()) {
      if(name.value && rif.value && rif.value.toString().length === 9 && racda.value && new Date(racda.value).getTime() > Date.now() && !emp.find(item => item.name === name.value) && !emp.find(item => item.rif === rif.value)){
        dTrat.length = 0;
        dTrans.length = 0;
        rac.value = '';
        nm.value = '';
        rv.value = '';
        cargando.value = true;
        const inputData = {name: name.value, rif: rif.value, venc: racda.value, tel: tel.value, email: email.value, uid: userStore.userData.uid};

        validate.value = 'needs-validation';
        const docRef = await addDoc(collection(db, `${type}`), inputData);
        console.log(docRef.id);
        showMessage('Empresa registrada exitosamente.', 'text-bg-success');
        name.value = racda.value = rif.value = tel.value = email.value = null;
        type === 'empTrat' ? dTrat.push({... inputData, id: docRef.id}) : dTrans.push({... inputData, id: docRef.id});
        showData(tabCont, inputData, docRef.id);
        iconsFunc(type, conf.value, deleteItem, getItemEdit);
        cargando.value = false;
      } else {
        validate.value = 'was-validated';
      }
    } else {
      validate.value = 'was-validated';
    }
  } catch (e) {
    console.log(e.message);
  }
};

const getItems = async type => {
  try {
    const q = query(collection(db, `${type}`), where("uid", "==", userStore.userData.uid), orderBy("name"));
    const querySnapshot = await getDocs(q);
    const tabCont = document.getElementById(`${type}`);
    tabCont.innerHTML = '';

    querySnapshot.forEach(doc => {
      showData(tabCont, doc.data(), doc.id);
      type === 'empTrat' ? dTrat.push({... doc.data(), id: doc.id}) : dTrans.push({... doc.data(), id: doc.id});
    });    

    iconsFunc(type, conf.value, deleteItem, getItemEdit);
  } catch (e) {
    console.log(e.message);
  }
};

const searchTrt = type => {
  const tableTra = document.getElementById(type);
  tableTra.innerHTML = '';
  let resulTrt;

  if(type === 'empTrat')
    resulTrt = dTrat.find(i => i.name.toLowerCase().replace(/\s+/g, '') == tratName.value.toLowerCase().replace(/\s+/g, ''));
  else
    resulTrt = dTrans.find(i => i.name.toLowerCase().replace(/\s+/g, '') == transName.value.toLowerCase().replace(/\s+/g, ''));

  if(resulTrt){
    showData(tableTra, resulTrt, resulTrt.id);
  } else {
    if(type === 'empTrat'){
      dTrat.forEach(emp => {
        showData(tableTra, emp, emp.id);
      });
    } else {
      dTrans.forEach(emp => {
        showData(tableTra, emp, emp.id);
      });
    }
  }
  iconsFunc(type, conf.value, deleteItem, getItemEdit);
};

const showMessage = (message, color) => {
  const toastLiveExample = document.getElementById('liveToast');
  const toast = new Toast(toastLiveExample);
  res.value = message;
  msgColor.value = color;
  toast.show();
};

const deleteItem = async (id, type) => {
  try {
    if(type === 'empTrat'){
      const delObj = dTrat.findIndex(i => i.id === id);
      dTrat.splice(delObj, 1);
    } else {
      const delObj = dTrans.findIndex(i => i.id === id);
      dTrans.splice(delObj, 1);
    }

    await deleteDoc(doc(db, `${type}`, id));
    showMessage('Empresa eliminada exitosamente.', 'text-bg-success');
  } catch (e) {
    console.log(e.message);
  }
};

const getItemEdit = async (id, type) => {
  try {
    name.value = racda.value = rif.value = currType.value = currID.value = typeN.value = tel.value = email.value = null;
    const docRef = doc(db, `${type}`, id);
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
      if(type == 'empTrans')
       typeN.value = 'Empresa de Transporte';
      else
       typeN.value = 'Empresa Tratante';
    }
  } catch (e) {
    console.log(e.message);
  }
};

const edit = async() => {
  const myModal = document.getElementById('disEdit');
  const tableTra = document.getElementById(currType.value);
  res.value = '';

  if(name.value)
    nm.value = 'valid';
  else
    nm.value ='invalid';

  if(rif.value)
    rv.value = 'valid';
  else
    rv.value ='invalid';

  if (racda.value && new Date(racda.value).getTime() > Date.now()){
    rac.value = 'valid';
  } else if(racda.value && new Date(racda.value).getTime() < Date.now()){
    showMessage('Racda vencido.', 'text-bg-danger');
    rac.value = 'invalid';
  } else {
    rac.value = 'invalid';
  }

  try {
    if(name.value && rif.value && new Date(racda.value).getTime() > Date.now() && tel.value && email.value){
      cargando.value = true;
      const docRef = doc(db, currType.value, currID.value);
      await updateDoc(docRef, {name: name.value, rif: rif.value, venc: racda.value, tel: tel.value, email: email.value});
      validate.value = 'needs-validation';
      tableTra.innerHTML = '';

      if(currType.value === 'empTrat'){
        const updObj = dTrat.findIndex(i => i.id === currID.value);
        dTrat[updObj] = {...dTrat[updObj], name: name.value, rif: rif.value, venc: racda.value, tel: tel.value, email: email.value};
        dTrat.forEach(i => {
          showData(tableTra, i, i.id);
        });
      } else {
        const updObj = dTrans.findIndex(i => i.id === currID.value);
        dTrans[updObj] = {...dTrans[updObj], name: name.value, rif: rif.value, venc: racda.value, tel: tel.value, email: email.value};
        dTrans.forEach(i => {
          showData(tableTra, i, i.id);
        });
      }
      iconsFunc(currType.value, conf.value, deleteItem, getItemEdit);
    
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

const reset = () => {
  name.value = racda.value = rif.value = tel.value = email.value = currType.value = currID.value = typeN.value = null;
  res.value = '';
};

const showData = (table, data, id) => {
  table.innerHTML +=`
                      <tr>
                        <td hidden>${id}</td>
                        <td>J-${data.rif}</td>
                        <td>${data.name}</td>
                        <td class="calc" hidden>${data.venc}</td>
                        <td>${getDateInfo(data.venc)}<i class="bi bi-trash float-end" data-bs-toggle="modal" data-bs-target="#confirmacion" style="cursor: pointer;"></i><i class="bi bi-pencil float-end me-3" style="cursor: pointer;" data-bs-toggle="modal" data-bs-target="#tratEditModal"></i><i class="bi bi-eye float-end me-3" style="cursor: pointer;" data-bs-toggle="modal" data-bs-target="#tratInfoModal"></i></td>
                      </tr>
                    `;
};

const confir = bool => {
  conf.value = bool;
  setTimeout(() => {
    conf.value = '';
  }, 550);
};

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
              <div class="col-6">
                <label for="inputTelTrat" class="form-label">Teléfono</label>
                <input type="tel" class="form-control" pattern="[0-9]{4}-[0-9]{7}" placeholder="0424-4567890" id="inputTelTrat" v-model="tel" required>
              </div>
              <div class="col-6">
                <label for="inputEmailTrat" class="form-label">Email</label>
                <input type="email" class="form-control" id="inputEmailTrat" v-model.trim="email" required>
              </div>
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
              <div class="col-6">
                <label for="inputTelTrans" class="form-label">Teléfono</label>
                <input type="tel" class="form-control" pattern="[0-9]{4}-[0-9]{7}" placeholder="0424-4567890" id="inputTelTrans" v-model="tel" required>
              </div>
              <div class="col-6">
                <label for="inputEmailTrans" class="form-label">Email</label>
                <input type="email" class="form-control" id="inputEmailTrans" v-model.trim="email" required>
              </div>
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
              <div class="col-6">
                <label for="inputTel" class="form-label">Teléfono</label>
                <input type="tel" class="form-control" id="inputTel" pattern="[0-9]{4}-[0-9]{7}" placeholder="0424-4567890" v-model="tel" required>
              </div>
              <div class="col-6">
                <label for="inputEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="inputEmail" v-model.trim="email" required>
              </div>
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

    <div class="modal fade" id="tratInfoModal" tabindex="-1" aria-labelledby="tratInfoModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="tratInfoModalLabel">{{typeN}}</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent :class="`row g-3 ${validate}`" novalidate>
              <div class="col-12">
                <label for="inputNameTrat" class="form-label">Nombre</label>
                <input type="text" :class="`form-control ${nm}`" id="inputNameTrat" v-model="name" readonly required>
              </div>
              <div class="col-6">
                <label for="inputNameRif" class="form-label">Rif</label>
                <div class="input-group">
                  <span class="input-group-text">J-</span>
                  <input type="number" :class="`form-control ${rv}`" min="0" max="999999999" oninput="validity.valid||(value='');" id="inputNameRif" v-model="rif" readonly required>
                </div>
              </div>
              <div class="col-6">
                <label for="inputRacda" class="form-label">Venc. RACDA</label>
                <input type="date" :class="`form-control ${rac}`" id="inputRacda" v-model="racda" readonly required>
              </div>
              <div class="col-6">
                <label for="inputTel" class="form-label">Teléfono</label>
                <input type="tel" class="form-control" id="inputTel" pattern="[0-9]{4}-[0-9]{7}" v-model="tel" readonly required>
              </div>
              <div class="col-6">
                <label for="inputEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="inputEmail" v-model.trim="email" readonly required>
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
              <div class="col-4 float-end me-5">
                <input type="text" class="form-control" placeholder="Buscar nombre" id="searchTrat" v-model="tratName" @keyup.enter="searchTrt('empTrat')">
              </div>
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
                <div class="col-4 float-end me-5">
                  <input type="text" class="form-control" placeholder="Buscar nombre" id="searchTrans" v-model="transName" @keyup.enter="searchTrt('empTrans')">
                </div>
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