<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {db} from '../firebaseConfig';
import {doc, deleteDoc, getDocs, query, orderBy, where, collection, addDoc} from 'firebase/firestore'; 
import {useUserStore} from '../stores/user';
import {useMix} from '../composables/mix';
import {Toast} from 'bootstrap';
import router from '../router';
import VueMultiselect from 'vue-multiselect';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const userStore = useUserStore();
const {getDateInfo} = useMix();

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
const isEmpty = ref(true);
const textEmpty = ref(false);

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
    res.value = e.message;
    showMessage(e.message, 'text-bg-danger')
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
    res.value = e.message;
    showMessage(e.message, 'text-bg-danger')
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
    isEmpty.value = querySnapshot.empty;
    textEmpty.value = true;
    
    querySnapshot.forEach(doc => {
      showData(tabCont, doc.data(), doc.id);
      dat.push({... doc.data()});
    });
    showTotalSum(showSum);

    const delIcon = document.querySelectorAll('.bi-trash');
    delIcon.forEach(i => {
      const id = i.parentElement.parentElement.parentElement.firstElementChild.innerHTML;
      const desecho = i.parentElement.parentElement.parentElement.firstElementChild.nextElementSibling.innerHTML;

      const waitConf = async () => {
        if(conf.value === ''){
          setTimeout(waitConf, 500);
        } else if(conf.value === true){
          i.parentElement.parentElement.parentElement.remove();
          await deleteItem(id, desecho, showSum);
        }
      };
      i.addEventListener("click", waitConf);
    });

    const eyeIcon = document.querySelectorAll('.bi-eye');
    eyeIcon.forEach(i => {
      const data =  i.parentElement.parentElement.previousElementSibling;
      i.addEventListener('click', () => {
        router.push(`/app/${data.innerHTML.toLowerCase().replace(/\s+/g, '')}`)
      });
    });

  } catch (e) {
    res.value = e.message;
    showMessage(e.message, 'text-bg-danger')
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
    res.value = e.message;
    showMessage(e.message, 'text-bg-danger')
  }
};

const showMessage = (message, color) => {
  const toastLive = document.getElementById('liveToast');
  const toast = new Toast(toastLive);
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
                        <td class="p-3" hidden>${id}</td>
                        <td class="p-3">${data.desecho}</td>
                        <td class="p-3 d-flex justify-content-between">${Number.isInteger(data.cp) ? data.cp: parseFloat(data.cp.toFixed(4))} kg 
                          <div>
                            <i class="bi bi-eye" style="cursor: pointer"></i>
                            <i class="bi bi-trash ms-1 ms-sm-2 ms-md-3 ms-xl-4" data-bs-toggle="modal" data-bs-target="#confirmacion" style="cursor: pointer;"></i>
                          </div>
                        </td>
                      </tr>
                    `;

};

const showTotalSum = element => {
  dat.forEach(i => {
    sumTotal.value += i.cp;
  });

  Number.isInteger(sumTotal.value) ? sumTotal.value: sumTotal.value = parseFloat(sumTotal.value.toFixed(4));
  element.innerHTML +=`
                        <div class="d-flex align-items-center justify-content-between fw-bold w-100 mt-4 mt-md-5 p-3" style="background-color: #f2f2f2">
                          <p class="mb-0 ms-2">PESO TOTAL</p>
                          <p class="mb-0 ps-3">${sumTotal.value} kg</p>
                          <p></p>
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

  <main class="main container d-flex flex-column gap-5 mt-5 pt-3 pt-lg-5 ">

    <div class="main__new ms-auto">
      <button class="main__new-btn" v-if="userStore.wait == 1" type="button" data-bs-toggle="modal" data-bs-target="#newModal">Nuevo</button>
      <p class="main__danger text-danger" v-if="userStore.wait == 2">Renueve el Racda</p>
      <p class="main__warning text-warning" v-if="userStore.wait == 3">Ingrese el Racda</p>
    </div>

    <div :class="{'d-flex flex-column min-dvh-35 justify-content-center align-items-center' : isEmpty,
                  'd-none': !isEmpty
                }">
      <div v-if="isEmpty && textEmpty" class="h2 text-center">No existe ningún registro, cree uno nuevo.</div>
    </div>

    <div :class="{'main__content' : !isEmpty,
                  'd-none' : isEmpty
                }">
      <div class="main__header text-center mb-5">Consolidado de Desechos</div>
      <table class="main__table" id="tab">
        <thead class="main__thead">
          <tr>
            <th class="main__th w-50" scope="col">Desecho</th>
            <th class="main__th d-flex w-100" scope="col">
              <p class="mb-0">Peso</p>
              <button class="main__printer-btn ms-auto" @click="generatePDF" type="button">
                <i class="bi bi-printer"></i>
              </button>
            </th>
          </tr>
        </thead>
        <tbody class="main__tbody" id="table-content">
          
        </tbody>
      </table>
      <div class="main__sum sum mb-4"></div>
    </div>

    <div class="modal fade" id="newModal" tabindex="-1" aria-labelledby="newModalLabel" aria-hidden="true">
      <div class="modal__new modal-dialog modal-sm mx-auto modal-dialog-centered">
        <div class="modal__new-content modal-content">
          <div class="modal__new-header modal-header">
            <h1 class="modal__new-title modal-title ps-3" id="newModalLabel">Nuevo Desecho</h1>
            <button class="modal__new-close btn-close me-2" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal__new-body modal-body">
            <form :class="`modal__new-form ${validate}`" @submit.prevent="getData" novalidate>

              <div class="modal__new-input d-flex justify-content-between align-items-center gap-5 ms-3 mb-3">
                <div :class="`w-100 ${sm}`" v-if="!byHand">
                  <VueMultiselect
                  v-model="selectedMaterial"
                  :options="materialOptions"
                  :allow-empty="false"
                  :show-labels="false"
                  placeholder="..."
                  />
                </div>
                <div class="modal__folder" v-else>
                  <input :class="`modal__new-manual multiselect multiselect__tags multiselect__input multiselect__single ${sm}`" type="text" id="byHandDes" v-model="selectedMaterial" required>
                </div>

                <div class="modal__new-icons pe-3">
                  <i class="bi bi-pencil-square" v-if="!byHand" style="font-size: 25px; cursor: pointer" @click="byHand = !byHand"></i>
                  <i class="bi bi-folder" v-else style="font-size: 25px; cursor: pointer" @click="byHand = !byHand"></i>
                </div>
              </div>

              <div class="modal__new-footer modal-footer">
                <button class="modal__new-btn w-100" v-if ="!adding" type="submit">Registrar</button>
                <button class="modal__new-btn d-flex align-items-center justify-content-center w-100" v-else type="button" disabled>
                  <span class="modal__new-loading spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Registrando...
                </button>
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
            <button class="modal__delete-close btn-close me-2" type="button" data-bs-dismiss="modal" aria-label="Close" @click=confir(false)></button>
          </div>
          <div class="modal__delete-body modal-body">
            <p class="ps-3">Se eliminaran todos los registros asociados al desecho.</p>
            <div class="modal__delete-footer modal-footer">
              <button class="modal__delete-btn" v-if ="!adding" type="button" data-bs-dismiss="modal" aria-label="Close" @click=confir(false)>Cancelar</button>
              <button class="modal__delete-btn" v-if ="!adding" type="button" data-bs-dismiss="modal" aria-label="Close" @click=confir(true)>Aceptar</button>
              <button class="modal__delete-btn d-flex align-items-center justify-content-center" v-else type="button" disabled>
                <span class="modal__delete-loading spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Eliminando...
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="toast-container position-fixed translate-middle-x top-0 start-50 p-3">
      <div class="toast" id="liveToast" role="alert" aria-live="assertive" aria-atomic="true">
        <div :class="`d-flex ${msgColor}`">
          <div class="toast-body text-center">
            {{res}}
          </div>
          <button class="btn-close btn-close-white me-2 m-auto" type="button" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    </div>

  </main>
  
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>