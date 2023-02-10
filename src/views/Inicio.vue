<script setup>
import { onMounted, ref } from 'vue';
import { db } from '../firebaseConfig';
import { doc, deleteDoc, getDocs, query, orderBy, where, collection, addDoc } from 'firebase/firestore'; 
import { useUserStore } from '../stores/user';
import { useMix } from '../composables/mix';
import VueMultiselect from 'vue-multiselect';
import  jsPDF  from 'jspdf';
import autoTable from 'jspdf-autotable';

const userStore = useUserStore();
const { getDateInfo } = useMix()

const selectedMaterial = ref(null);
const validate = ref('needs-validation');
const inputData = ref(null);
const sm = ref('');
const adding = ref(false);
const conf = ref('');
let dat = [];
const sumTotal = ref(0);

const materialOptions = ['Pantalla', 'Teléfono', 'Computadora', 'Disco Duro (HDD)', 'Disco Sólido (SSD)', 'Ram', 'Tarjeta Madre', 'Procesador (CPU)', 'Tarjeta Gráfica (GPU)', 'Fuente de Poder (PSU)', 'Mouse', 'Teclado', 'Pila', 'Batería'];

const getData = async () => {
  const getForm = document.querySelector('form')

  if(selectedMaterial.value !== null && !dat.find((item) => item.desecho === selectedMaterial.value)){
    sm.value = 'valid';
  }
  else if (selectedMaterial.value === null || dat.find((item) => item.desecho === selectedMaterial.value)){
    sm.value = 'invalid';
  }

  if(getForm.checkValidity()) {
    if(selectedMaterial.value !== null && !dat.find((item) => item.desecho === selectedMaterial.value)){
      dat.length = 0;
      adding.value = true;
      inputData.value = {desecho: selectedMaterial.value, desechoID:selectedMaterial.value.toLowerCase().replace(/\s+/g, ''), cp: 0, uid: userStore.userData.uid};
      sm.value = '';
      validate.value = 'needs-validation';

      await addItem(inputData.value);
      selectedMaterial.value = null;
      adding.value = false;
    }
  }
  else{
    validate.value = 'was-validated';
  }
};

const addItem = async data => {
  try {
    await addDoc(collection(db, "desecho"), data)
    await getItems()
  } catch (error) {
    console.log(error.code, error.message);
  };
};

const getItems = async () => {
  const tabCont = document.getElementById('table-content');
  const showSum = document.querySelector('.sum');

  try {
    const q = query(collection(db, "desecho"), where("uid", "==", userStore.userData.uid), orderBy("desecho"));
    tabCont.innerHTML = '';
    showSum.innerHTML = '';
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      showData(tabCont, doc.data(), doc.id);
      dat.push({... doc.data()});
    });

    showTotalSum(showSum);

    const delIcon = document.querySelectorAll('.bi-trash')
    delIcon.forEach(i => {
      const id = i.parentElement.parentElement.firstElementChild.innerHTML
      const desecho = i.parentElement.parentElement.firstElementChild.nextElementSibling.innerHTML

      const waitConf = () => {
        if(conf.value === ''){
          setTimeout(waitConf, 500)
        }
        else if(conf.value === true){
          i.parentElement.parentElement.remove();
          deleteItem(id, desecho, showSum);
        }
      }

      i.addEventListener("click", waitConf);
    });

  } catch (error) {
    console.log(error.code, error.message);
  }
};

const deleteItem = async (id, desecho, showSum) => {
  try {
    await deleteDoc(doc(db, "desecho", id));
    dat = dat.filter(item => item.desecho !== desecho)

    const q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desecho", "==", desecho));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doct) => {
      deleteDoc(doc(db, "item", doct.id));
    });

    sumTotal.value = 0
    showSum.innerHTML = ''
    showTotalSum(showSum)

  } catch (error) {
    console.log(error.code, error.message);
  };
};

const confir = bool => {
  conf.value = bool;
  setTimeout(() => {
    conf.value = ''
  }, 550);
}

const showData = (table, data, id) => {
  table.innerHTML += `
                      <tr>
                        <td hidden>${id}</td>
                        <td>${data.desecho}</td>
                        <td>${Number.isInteger(data.cp) ? data.cp: parseFloat(data.cp.toFixed(4))} kg <i data-bs-toggle="modal" data-bs-target="#confirmacion" class="bi bi-trash ms-4 me-4 float-end" style="cursor: pointer;"></i> <a href="/app/${data.desecho.toLowerCase().replace(/\s+/g, '')}" class="text-dark"><i class="bi bi-eye float-end" style="cursor: pointer"></i></a></td>
                      </tr>
                      `
};

const showTotalSum = element => {
  dat.forEach(i => {
      sumTotal.value += i.cp
    });

    Number.isInteger(sumTotal.value) ? sumTotal.value: sumTotal.value = parseFloat(sumTotal.value.toFixed(4));
    element.innerHTML += `
                        <div class="bg-light d-flex align-items-center fw-bold mt-5 w-100">
                          <p class="mb-0">Peso Final</p>
                          <p class="d-none d-xxl-block mc mb-0">${sumTotal.value} kg</p>
                          <p class="d-block d-xxl-none mcs mb-0">${sumTotal.value} kg</p>
                        </div>
                        `
};

const generatePDF = () => {
  const pdf = jsPDF()

  pdf.autoTable({ 
    html: '#tab', 
    startY: 30, 
    didDrawPage: data => {
      // Header
      data.settings.margin.top = 30;
      pdf.setFontSize(8);
      pdf.setTextColor(40);

      pdf.text('Green Tree', 180, 5)
      pdf.setFontSize(13);
      pdf.text(`${userStore.userData.name}`, data.settings.margin.left, 9)
      pdf.setFontSize(11);
      pdf.text('Consolidado de Desechos', data.settings.margin.left, 15);      
      pdf.text(`Fecha: ${getDateInfo(Date.now())}`, data.settings.margin.left, 20);      
      pdf.text(`Peso Final: ${Number.isInteger(sumTotal.value) ? sumTotal.value : parseFloat(sumTotal.value.toFixed(4))} kg`, data.settings.margin.left, 25);

      // Footer
      var str = "" + pdf.getNumberOfPages();

      pdf.setFontSize(10);

      var pageSize = pdf.internal.pageSize;
      var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      pdf.text(str, 195, pageHeight - 10);
    } 
  })

  pdf.save(`Reporte.pdf`);

}

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
              <div :class="`${sm}`">
                <VueMultiselect
                v-model="selectedMaterial"
                :options="materialOptions"
                :allow-empty="false"
                :show-labels="false"
                placeholder="Desecho"
                />
              </div>
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

/* .cm {
  box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset;
} */

.mc {
  margin-left: 15.5rem;
}

.mcs {
  margin-left: 9.8rem;
}
</style>