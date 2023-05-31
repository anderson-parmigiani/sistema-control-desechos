<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { db } from '../firebaseConfig';
import { doc, deleteDoc, getDocs, query, orderBy, where, collection, addDoc } from 'firebase/firestore'; 
import { useUserStore } from '../stores/user';
import { useMix } from '../composables/mix';
import { Toast } from 'bootstrap';
import router from '../router';
import VueMultiselect from 'vue-multiselect';
import  jsPDF  from 'jspdf';
import autoTable from 'jspdf-autotable';

const userStore = useUserStore();
const { getDateInfo } = useMix();

const selectedMaterial = ref(null);
const inputData = ref(null);
const adding = ref(false);
const byHand = ref(false);
const conf = ref<string | boolean>('');
const sm = ref('');
const res = ref('');
const msgColor = ref('');
const validate = ref('needs-validation');
const sumTotal = ref(0);
let dat = [];

const materialOptions = ['Pantalla', 'Teléfono', 'Computadora', 'HDD', 'SSD', 'Ram', 'Tarjeta Madre', 'Procesador', 'Tarjeta Gráfica', 'Fuente de Poder', 'Mouse', 'Teclado', 'Batería'];

const getData = async () => {
  try {
    if(!selectedMaterial.value) throw new Error('Ingrese un desecho.');
    if(dat.find(item => item.desecho === selectedMaterial.value)) throw new Error('El desecho ya existe.');

    inputData.value = {desecho: selectedMaterial.value, desechoID:selectedMaterial.value.toLowerCase().replace(/\s+/g, ''), cp: 0, uid: userStore.userData.uid};
    sm.value = 'valid';
    dat.length = 0;
    adding.value = true;

    await addItem(inputData.value);

    selectedMaterial.value = null;
    adding.value = false;
    sm.value = '';
    validate.value = 'needs-validation';
  } catch (e) {
    sm.value = 'invalid';
    console.log(e.message);
  } finally {
    validate.value = 'was-validated';
  }
};

const addItem = async data => {
  try {
    await addDoc(collection(db, "desecho"), data);
    await getItems();
    showMessage('Desecho registrado exitosamente.', 'text-bg-success');
  } catch (e) {
    console.log(e.message);
  }
};

const getItems = async () => {
  try {
    const q = query(collection(db, "desecho"), where("uid", "==", userStore.userData.uid), orderBy("desecho"));
    const tabCont = document.getElementById('table-content');
    const showSum = document.querySelector('.sum');
    tabCont.innerHTML = '';
    showSum.innerHTML = '';

    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => {
      showData(tabCont, doc.data(), doc.id);
      dat.push({... doc.data()});
    });
    showTotalSum(showSum);

    const delIcon = document.querySelectorAll('.bi-trash');
    delIcon.forEach(i => {
      const id = i.parentElement.parentElement.firstElementChild.innerHTML;
      const desecho = i.parentElement.parentElement.firstElementChild.nextElementSibling.innerHTML;

      const waitConf = async () => {
        if(conf.value === ''){
          setTimeout(waitConf, 500);
        } else if(conf.value === true){
          i.parentElement.parentElement.remove();
          await deleteItem(id, desecho, showSum);
        }
      };
      i.addEventListener("click", waitConf);
    });

    const eyeIcon = document.querySelectorAll('.bi-eye');
    eyeIcon.forEach(i => {
      const data =  i.parentElement.previousElementSibling;
      i.addEventListener('click', () => {
        router.push(`/app/${data.innerHTML.toLowerCase().replace(/\s+/g, '')}`)
      })
    })
  } catch (e) {
    console.log(e.message);
  }
};

const deleteItem = async (id, desecho, showSum) => {
  try {
    await deleteDoc(doc(db, "desecho", id));
    dat = dat.filter(item => item.desecho !== desecho);

    const q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desecho", "==", desecho));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doct => {
      deleteDoc(doc(db, "item", doct.id));
    });
    showMessage('Desecho eliminado exitosamente.', 'text-bg-success');

    sumTotal.value = 0;
    showSum.innerHTML = '';
    showTotalSum(showSum);
  } catch (e) {
    console.log(e.message);
  }
};

const showMessage = (message, color) => {
  const toastLiveExample = document.getElementById('liveToast');
  const toast = new Toast(toastLiveExample);
  res.value = message;
  msgColor.value = color;
  toast.show();
};

const confir = bool => {
  conf.value = bool;
  setTimeout(() => {
    conf.value = '';
  }, 550);
};

const showData = (table, data, id) => {
  table.innerHTML +=`
                      <tr>
                        <td hidden>${id}</td>
                        <td>${data.desecho}</td>
                        <td>${Number.isInteger(data.cp) ? data.cp: parseFloat(data.cp.toFixed(4))} kg <i data-bs-toggle="modal" data-bs-target="#confirmacion" class="bi bi-trash ms-4 me-4 float-end" style="cursor: pointer;"></i><i class="bi bi-eye float-end" style="cursor: pointer"></i></td>
                      </tr>
                    `;

};

const showTotalSum = element => {
  dat.forEach(i => {
    sumTotal.value += i.cp;
  });

  Number.isInteger(sumTotal.value) ? sumTotal.value: sumTotal.value = parseFloat(sumTotal.value.toFixed(4));
  element.innerHTML +=`
                        <div class="bg-light d-flex align-items-center fw-bold mt-5 w-100">
                          <p class="mb-0">Peso Total</p>
                          <p class="d-none d-xxl-block mc mb-0">${sumTotal.value} kg</p>
                          <p class="d-none d-xl-block d-xxl-none mcm mb-0">${sumTotal.value} kg</p>
                          <p class="d-block d-xl-none mcs mb-0">${sumTotal.value} kg</p>
                        </div>
                      `;
};

const generatePDF = () => {
  const pdf = new jsPDF();

  autoTable(pdf, { 
    html: '#tab', 
    startY: 30, 
    didDrawPage: data => {
      data.settings.margin.top = 30;
      pdf.setFontSize(8);
      pdf.setTextColor(40);

      pdf.text('Green Tree', 180, 5);
      pdf.setFontSize(13);
      pdf.text(`${userStore.userData.name}`, data.settings.margin.left, 9);
      pdf.setFontSize(11);
      pdf.text('Consolidado de Desechos', data.settings.margin.left, 15);      
      pdf.text(`Fecha: ${getDateInfo(Date.now())}`, data.settings.margin.left, 20);      
      pdf.text(`Peso Total: ${Number.isInteger(sumTotal.value) ? sumTotal.value : parseFloat(sumTotal.value.toFixed(4))} kg`, data.settings.margin.left, 25);

      var str = "" + pdf.getNumberOfPages();
      pdf.setFontSize(10);
      var pageSize = pdf.internal.pageSize;
      var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      pdf.text(str, 195, pageHeight - 10);
    } 
  });
  pdf.save(`Reporte.pdf`);
};

onMounted(() => {
  getItems();
});
</script>

<template>
  <div class="d-grid gap-2 d-flex justify-content-end me-3 mt-3">
    <button v-if="userStore.wait == 1" type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">Nuevo Desecho</button>
    <p v-if="userStore.wait == 2" class="text-danger">Renueve el Racda</p>
    <p v-if="userStore.wait == 3" class="text-warning">Ingrese el Racda</p>
  </div>
  <div class="container">
    <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="exampleModalLabel">Nuevo Desecho</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="getData" :class="`row g-3 ${validate}`" novalidate>
              <div v-if="!byHand" :class="`col-10 ${sm}`">
                <VueMultiselect
                v-model="selectedMaterial"
                :options="materialOptions"
                :allow-empty="false"
                :show-labels="false"
                placeholder="Desecho"
                />
              </div>
              <div v-else class="col-10">
                <input type="text" :class="`form-control ${sm}`" id="byHandDes" v-model="selectedMaterial" required>
              </div>
              <i v-if="!byHand" class="col-2 bi bi-pencil-square" style="font-size: 25px; cursor: pointer" @click="byHand = !byHand"></i>
              <i v-else class="col-2 bi bi-folder" style="font-size: 25px; cursor: pointer" @click="byHand = !byHand"></i>
              <div class="modal-footer">
                <button v-if ="!adding" type="submit" class="btn btn-primary">Registrar</button>
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

    <div class="modal fade" id="confirmacion" data-bs-backdrop="static" tabindex="-1" aria-labelledby="confimacionLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="confirmacionLabel">Confirmación</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click=confir(false)></button>
          </div>
          <div class="modal-body">
            <p>Se eliminaran todos los registros asociados al desecho.</p>
            <div class="modal-footer">
              <button v-if ="!adding" type="button" class="btn btn-primary" data-bs-dismiss="modal" aria-label="Close" @click=confir(false)>Cancelar</button>
              <button v-if ="!adding" type="button" class="btn btn-primary" data-bs-dismiss="modal" aria-label="Close" @click=confir(true)>Aceptar</button>
              <button v-else class="btn btn-primary" type="button" disabled>
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Eliminando...
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-3"></div>
      <div class="col-6">
        <div class="lead text-center fw-bold mb-5">Consolidado de Desechos</div>
        <table class="table table-hover table-borderless table-light" id="tab">
          <thead>
            <tr>
              <th class="w-25" scope="col">Desecho</th>
              <th class="w-25" scope="col">Peso <button class="btn btn-primary btn-sm float-end me-4" @click="generatePDF" type="button"><i class="bi bi-printer"></i></button></th>
            </tr>
          </thead>
          <tbody id="table-content"></tbody>
        </table>
        <div class="sum"></div>
      </div>
      <div class="col-3"></div>
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

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style>
.multiselect__placeholder {
  display: inline-block !important;
  margin-bottom: 0px !important;
  padding-top: 0px !important;
}

.multiselect.invalid .multiselect__tags {
  border: 1px solid #f86c6b !important;
}

.multiselect__option--highlight {
  background: #428bca !important;
}

.multiselect__option--highlight:after {
  background: #428bca !important;
}

.multiselect__tags {
  border: 1px solid #ced4da !important;
}

.multiselect__placeholder{
  margin-left: 10px;
  margin-top: 2px;
}

.multiselect__tag {
  background: #f0f0f0 !important;
  border: 1px solid rgba(60, 60, 60, 0.26) !important;
  color: black !important;
  margin-bottom: 0px !important;
  margin-right: 5px !important;
}

.multiselect__tag-icon:after {
  color: rgba(60, 60, 60, 0.5) !important;
}

.multiselect__tag-icon:focus,
.multiselect__tag-icon:hover {
  background: #f0f0f0 !important;
}

.multiselect__tag-icon:focus:after,
.multiselect__tag-icon:hover:after {
  color: red !important;
}

.multiselect__select:before {
    color: black !important;
    border-top-color: black !important;
}

.invalid .multiselect__tags {
  border-color: #f04124!important;
}

.valid .multiselect__tags {
  border-color: #198754!important;
}

.mc {
  margin-left: 15.5rem;
}

.mcm {
  margin-left: 12.8rem;
}

.mcs {
  margin-left: 9.8rem;
}
</style>