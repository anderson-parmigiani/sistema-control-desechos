<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router'
import { db } from '../firebaseConfig';
import { doc, getDoc, getDocs, deleteDoc, query, where, collection, orderBy, addDoc, updateDoc, limit, startAfter, limitToLast, endBefore} from 'firebase/firestore'; 
import { useUserStore } from '../stores/user';
import { useMix } from '../composables/mix';
import { Toast } from 'bootstrap';
import VueMultiselect from 'vue-multiselect';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Chart from 'chart.js/auto';

const userStore = useUserStore();
const { getDateInfo } = useMix();

const selectedCP = ref(null);
const cp = ref(null);
const fecha = ref(null);
const hora = ref(null);
const racdaTrans = ref(null);
const racdaTrat = ref(null);
const currID = ref(null);
const nombreDesecho = ref(null);
const intege = ref(null);
const rifTrans = ref(null);
const rifTrat = ref(null);
const eS = ref(null);
const adding = ref(false);
const directoryTrans = ref(false);
const directoryTrat = ref(false);
const nextDisabled = ref(false);
const previousDisabled = ref(false);
const hideCP = ref(false);
const spac = ref(true);
const com = ref('');
const empTrans = ref('');
const empTrat = ref('');
const scp = ref('');
const su = ref('');
const sf = ref('');
const sh = ref('');
const conf = ref('');
const sDate = ref('');
const eDate = ref('');
const res = ref('');
const msgColor = ref('');
const sum = ref(0);
const validate = ref('needs-validation');
const tipMov = ref('Todos');
let dat = [], daTrans = [], daTrat = [], daTransFilt = [], daTratFilt = [], allFiltData = [], it = [];
let lastVisible = null, firstVisible = null;
const nItem = 7;
const cpOptions = ['g', 'kg', 'tn'];
const movOptions = ['Todos', 'Entradas', 'Salidas'];

const route = useRoute();

const getName = async () => {
  try {
    const q = query(collection(db, "desecho"), where("uid", "==", userStore.userData.uid));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      dat.push({... doc.data()});
    });

    nombreDesecho.value = dat.find((item) => item.desechoID === route.params.name);
    dat.length = 0;
  } catch (error) {
    console.log(error.code, error.message);
  }
};

const getItems = async () => {
  daTrans.length = 0, daTransFilt.length = 0, daTrat.length = 0, daTratFilt.length = 0;
  try {
    let q = query(collection(db, "empTrans"), where("uid", "==", userStore.userData.uid), orderBy("name"));
    let querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      daTrans.push({... doc.data()});
    });

    daTrans = daTrans.filter(item => new Date(item.venc) > Date.now());
    daTrans.forEach(i => {
      daTransFilt.push(i.name);
    });

    q = query(collection(db, "empTrat"), where("uid", "==", userStore.userData.uid), orderBy("name"));
    querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      daTrat.push({... doc.data()});
    });

    daTrat = daTrat.filter(item => new Date(item.venc) > Date.now())
    daTrat.forEach(i => {
      daTratFilt.push(i.name);
    });

  } catch (error) {
    console.log(error.code, error.message);
  }
};

const checkData = async () => {
  const getForm = document.querySelector('form');

  if(cp.value === null){
    scp.value = 'invalid';
  } else {
    scp.value = 'valid';
  }

  if(selectedCP.value === null){
    su.value = 'invalid';
  } else {
    su.value = 'valid';
  }

  if(fecha.value === null){
    sf.value = 'invalid';
  } else {
    sf.value = 'valid';
  }

  if(hora.value === null){
    sh.value = 'invalid';
  } else {
    sh.value = 'valid';
  }

  try {
    if(getForm.checkValidity()) {

      if(cp.value !== null && selectedCP.value !== null && fecha.value !== null && hora.value !== null && (eS.value === 'Entrada' || eS.value === 'Salida')){
        const foundRep = it.find(i => i.fecha == fecha.value && i.hora == hora.value)
        if(!foundRep) {
          if(racdaTrans.value !== null && racdaTrat.value !== null){
            if(new Date(racdaTrans.value) > Date.now() && new Date(racdaTrat.value) > Date.now()){
              await getData();
            }
          } else if(racdaTrans.value == null && racdaTrat.value == null){
            await getData();
          } else if(racdaTrans.value !== null){
            if(new Date(racdaTrans.value) > Date.now()){
              await getData();
            }
          } else if(racdaTrat !== null){
            if(new Date(racdaTrat.value) > Date.now()){
              await getData();
            }
          }
        } else {
          showMessage('Ya existe un movimiento con la misma fecha y hora.', 'text-bg-danger');
        }
      } else {
        showMessage('Complete los campos requeridos correctamente.', 'text-bg-danger');
        validate.value = 'was-validated';
      }
    } else {
      showMessage('Complete los campos requeridos correctamente.', 'text-bg-danger');
      validate.value = 'was-validated';
    }
  } catch (error) {
    console.log(error.code, error.message);
  }
};

const getData = async() => {
  const isInteg = Number.isInteger(cp.value);
  const inputData = ref(null);
  adding.value = true;

  if(selectedCP.value == 'g') {
    cp.value /= 1000;
  } else if(selectedCP.value == 'tn') {
    cp.value *= 1000; 
  }
  
  if(eS.value === 'Salida'){
    cp.value *= -1
  }

  if(empTrans.value == null){
    empTrans.value = '';
  }
  if(empTrat.value == null){
    empTrat.value = '';
  }

  inputData.value = {desecho: nombreDesecho.value.desecho, desechoID: route.params.name, cp: cp.value, typeCP: Math.sign(cp.value), selectedCP: selectedCP.value, integ: isInteg, fecha: fecha.value, hora: hora.value, empTrans: empTrans.value, empTrat: empTrat.value, com: com.value, uid: userStore.userData.uid};

  try {
    await addItem(inputData.value);
    scp.value = su.value = sf.value = sh.value = '';
    validate.value = 'needs-validation';
    cp.value = selectedCP.value = fecha.value = hora.value = racdaTrans.value = racdaTrat.value = rifTrans.value = rifTrat.value = eS.value = null;
    empTrans.value = empTrat.value = com.value = '';
    await initial();

  } catch (error) {
    console.log(error.code, error.message);
  }
};

const addItem = async data => {
  const q = query(collection(db, "empTrans"), where("uid", "==", userStore.userData.uid), where("rif", "==", rifTrans.value));
  const qs = query(collection(db, "empTrat"), where("uid", "==", userStore.userData.uid), where("rif", "==", rifTrat.value));

  try {
    await addDoc(collection(db, "item"), data);
    showMessage('Movimiento registrado exitosamente.', 'text-bg-success');

    if(rifTrans.value !== null && rifTrans.value !== undefined && rifTrans !== '' && rifTrat.value !== null && rifTrat.value !== undefined && rifTrat.value !== ''){
      const querySnapshot = await getDocs(q);
      const querySnap = await getDocs(qs);

      if(querySnapshot.empty == true && querySnap.empty == true){
        await addDoc(collection(db, "empTrans"), {name: empTrans.value, rif: rifTrans.value, venc: racdaTrans.value, uid: userStore.userData.uid});
        await addDoc(collection(db, "empTrat"), {name: empTrat.value, rif: rifTrat.value, venc: racdaTrat.value, uid: userStore.userData.uid});
        showMessage('Empresas registradas exitosamente.', 'text-bg-success');
        await getItems();
      }
    } else if(rifTrans.value !== null && rifTrans.value !== undefined && rifTrans !== ''){
      const querySnapshot = await getDocs(q);

      if(querySnapshot.empty == true){
        await addDoc(collection(db, "empTrans"), {name: empTrans.value, rif: rifTrans.value, venc: racdaTrans.value, uid: userStore.userData.uid});
        await getItems();
        showMessage('Empresa de Transporte registrada exitosamente.', 'text-bg-success');
      }
    } else if(rifTrat.value !== null && rifTrat.value !== undefined && rifTrat.value !== ''){
      const querySnap = await getDocs(qs);

      if(querySnap.empty == true){
        await addDoc(collection(db, "empTrat"), {name: empTrat.value, rif: rifTrat.value, venc: racdaTrat.value, uid: userStore.userData.uid});
        await getItems();
        showMessage('Empresa de Tratamiento registrada exitosamente.', 'text-bg-success');
      }
    }
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

const initial = async () => {
  const tabCont = document.getElementById('table-content');
  const pdfTabCont = document.getElementById('content');
  const butto = document.getElementById('but');
  it.length = 0;
  previousDisabled.value = true;
  nextDisabled.value = true;

  try {
    let q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), orderBy("fecha", "desc"), orderBy("hora", "desc"));
    let qt = q;
    spac.value = true;
    tabCont.innerHTML = '';
    let querySnapshot = await getDocs(q);
    sum.value = 0;
    if(tipMov.value !== 'Todos'){
      hideCP.value = true;
    }
    adding.value = false;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      it.push(data);
      sum.value += data.cp;
    });
    
    console.log(it);

    sumFunc(sum.value);

    if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && (eDate.value == null || eDate.value == undefined || eDate.value == '')){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(nItem));
        qt = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(nItem));
        qt = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(nItem));
        qt = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"));
      }

    } else if((sDate.value == null || sDate.value == undefined || sDate.value == '') && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(nItem));
        qt = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(nItem));
        qt = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(nItem));
        qt = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"));
      }

    } else if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(nItem));
        qt = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(nItem));
        qt = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(nItem));
        qt = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"));
      }

    } else {
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(nItem));   
        qt = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"));      
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(nItem));    
        qt = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"));          
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(nItem));
      }
    }

    tabCont.innerHTML = '';
    querySnapshot = await getDocs(q);
    let filterSum = await getDocs(qt);
    adding.value = false;

    if(querySnapshot.empty == false){
      spac.value= false;
    }

    querySnapshot.forEach(doc => {
      const data = doc.data();
      showData(tabCont, data, doc.id);
    });

    sum.value = 0;
    allFiltData.length = 0;
    pdfTabCont.innerHTML = '';

    filterSum.forEach(doc => {
      const data = doc.data();
      allFiltData.push({... data});
      showData(pdfTabCont, data, doc.id);
      sum.value += data.cp;
    });

    hideCP.value = false;

    if(querySnapshot.docs.length === 6){
      tabCont.innerHTML +=`
                            <br><br>
                          `; 
    } else if(querySnapshot.docs.length === 5){
      butto.classList.add("mt-4");
      tabCont.innerHTML +=`
                            <br><br><br>
                          `; 
    } else if(querySnapshot.docs.length === 4){
      tabCont.innerHTML +=`
                            <br><br><br><br><br>
                          `; 
    } else if(querySnapshot.docs.length === 3){
      tabCont.innerHTML +=`
                            <br><br><br><br><br><br><br>
                          `; 
    } else if(querySnapshot.docs.length === 2){
      butto.classList.add("mt-4");
      tabCont.innerHTML +=`
                            <br><br><br><br><br><br><br><br>
                          `;
    } else if(querySnapshot.docs.length === 1){
      tabCont.innerHTML +=`
                            <br><br><br><br><br><br><br><br><br><br>
                          `; 
    }

    const racs = document.querySelectorAll('.color');
      racs.forEach(i => {
        if(parseFloat(i.textContent) < 0){
          i.classList.add("bg-danger-subtle");
        } else {
          i.classList.add("bg-success-subtle");
        }
      });

    if(querySnapshot.docs.length < nItem){
      nextDisabled.value = true;
    }
    else if(querySnapshot.docs.length == 7){
      lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      querySnapshot = await getDocs(q);
      if(querySnapshot.docs.length >= 1){
        nextDisabled.value = false;
      }
    }

    const delIcon = document.querySelectorAll('.bi-trash');
      delIcon.forEach(i => {
        const id = i.parentElement.parentElement.firstElementChild.innerHTML;

        const waitConf = () => {
          if(conf.value === ''){
            setTimeout(waitConf, 500);
          } else if(conf.value === true){
            i.parentElement.parentElement.remove();
            deleteItem(id);
          }
        }

        i.addEventListener("click", waitConf);
      });

      const editIcon = document.querySelectorAll('.bi-pencil')
      editIcon.forEach(i => {
        const id = i.parentElement.parentElement.firstElementChild.innerHTML;

        i.addEventListener("click", () => {
          getItemEdit(id);
        });
      });

      const showIcon = document.querySelectorAll('.bi-eye')
      showIcon.forEach(i => {
        const id = i.parentElement.parentElement.firstElementChild.innerHTML;

        i.addEventListener("click", () => {
          getItemEdit(id);
        });
      });

  } catch (error) {
    console.log(error.code, error.message);
  }
};

const next = async () => {
  let q;
  const tabCont = document.getElementById('table-content');
  const butto = document.getElementById('but');
  nextDisabled.value = true;

  try {
    if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && (eDate.value == null || eDate.value == undefined || eDate.value == '')){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      }

    } else if((sDate.value == null || sDate.value == undefined || sDate.value == '') && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      }

    } else if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      }    

    } else{
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));      
      }
    }
    
    spac.value = true;
    tabCont.innerHTML = '';
    let querySnapshot = await getDocs(q);
    adding.value = false;

    lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    if(querySnapshot.empty == false){
      spac.value= false;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      showData(tabCont, data, doc.id);
    });

    if(querySnapshot.docs.length === 7){
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 7];
    } else if(querySnapshot.docs.length === 6){
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 6];
      tabCont.innerHTML +=`
                            <br><br>
                          `; 
    } else if(querySnapshot.docs.length === 5){
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 5];
      butto.classList.add("mt-4");
      tabCont.innerHTML +=`
                            <br><br><br>
                          `; 
    } else if(querySnapshot.docs.length === 4){
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 4];
      tabCont.innerHTML +=`
                            <br><br><br><br><br>
                          `; 
    } else if(querySnapshot.docs.length === 3){
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 3];
      tabCont.innerHTML +=`
                            <br><br><br><br><br><br><br>
                          `; 
    } else if(querySnapshot.docs.length === 2){
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 2];
      butto.classList.add("mt-4");
      tabCont.innerHTML +=`
                            <br><br><br><br><br><br><br><br>
                          `; 
    } else if(querySnapshot.docs.length === 1){
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      tabCont.innerHTML +=`
                            <br><br><br><br><br><br><br><br><br><br>
                          `; 
    }

    const racs = document.querySelectorAll('.color');
      racs.forEach(i => {
        if(parseFloat(i.textContent) < 0){
          i.classList.add("bg-danger-subtle");
        } else {
          i.classList.add("bg-success-subtle");
        }
      });

    if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && (eDate.value == null || eDate.value == undefined || eDate.value == '')){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      }

    } else if((sDate.value == null || sDate.value == undefined || sDate.value == '') && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      }

    } else if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      }

    } else {
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(nItem));      
      }
    }

    querySnapshot = await getDocs(q);
    previousDisabled.value = false;
    nextDisabled.value = false;

    if(querySnapshot.docs.length == 0){
      nextDisabled.value = true;
    }

    const delIcon = document.querySelectorAll('.bi-trash');
      delIcon.forEach(i => {
        const id = i.parentElement.parentElement.firstElementChild.innerHTML;

        const waitConf = () => {
          if(conf.value === ''){
            setTimeout(waitConf, 500);
          } else if(conf.value === true){
            i.parentElement.parentElement.remove();
            deleteItem(id);
          }
        }

        i.addEventListener("click", waitConf);
      });

      const editIcon = document.querySelectorAll('.bi-pencil');
      editIcon.forEach(i => {
        const id = i.parentElement.parentElement.firstElementChild.innerHTML;

        i.addEventListener("click", () => {
          getItemEdit(id);
        });
      });

      const showIcon = document.querySelectorAll('.bi-eye');
      showIcon.forEach(i => {
        const id = i.parentElement.parentElement.firstElementChild.innerHTML;

        i.addEventListener("click", () => {
          getItemEdit(id);
        });
      });

  } catch (error) {
    console.log(error.code, error.message);
  }
};

const prev = async () => {
  let q;
  const tabCont = document.getElementById('table-content');
  const butto = document.getElementById('but');
  butto.classList.remove("mt-4");
  previousDisabled.value = true;

  try {
    if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && (eDate.value == null || eDate.value == undefined || eDate.value == '')){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(nItem));
      }

    } else if((sDate.value == null || sDate.value == undefined || sDate.value == '') && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(nItem));
      }

    } else if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(nItem));
      }

    } else {
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(nItem));
      }
    }

    spac.value = true;
    tabCont.innerHTML = '';
    let querySnapshot = await getDocs(q);
    adding.value = false;

    lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    firstVisible = querySnapshot.docs[querySnapshot.docs.length - 7];

    if(querySnapshot.empty == false){
      spac.value= false;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      showData(tabCont, data, doc.id);
    });

    const racs = document.querySelectorAll('.color');
      racs.forEach(i => {
        if(parseFloat(i.textContent) < 0){
          i.classList.add("bg-danger-subtle");
        } else {
          i.classList.add("bg-success-subtle");
        }
      });

    if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && (eDate.value == null || eDate.value == undefined || eDate.value == '')){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limit(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limit(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limit(nItem));
      }

    } else if((sDate.value == null || sDate.value == undefined || sDate.value == '') && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limit(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limit(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limit(nItem));
      }

    } else if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limit(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limit(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limit(nItem));
      }

    } else {
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limit(nItem));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limit(nItem));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limit(nItem));
      }
    }

    querySnapshot = await getDocs(q);
    nextDisabled.value = false;
    previousDisabled.value = false;

    if(querySnapshot.docs.length == 0){
      previousDisabled.value = true;
    }

    const delIcon = document.querySelectorAll('.bi-trash');
      delIcon.forEach(i => {
        const id = i.parentElement.parentElement.firstElementChild.innerHTML;

        const waitConf = () => {
        if(conf.value === ''){
          setTimeout(waitConf, 500);
        } else if(conf.value === true){
          i.parentElement.parentElement.remove();
          deleteItem(id, desecho);
        }
      }

      i.addEventListener("click", waitConf);
      });

      const editIcon = document.querySelectorAll('.bi-pencil');
      editIcon.forEach(i => {
        const id = i.parentElement.parentElement.firstElementChild.innerHTML;

        i.addEventListener("click", () => {
          getItemEdit(id);
        });
      });

      const showIcon = document.querySelectorAll('.bi-eye');
      showIcon.forEach(i => {
        const id = i.parentElement.parentElement.firstElementChild.innerHTML;

        i.addEventListener("click", () => {
          getItemEdit(id);
        });
      });

  } catch (error) {
    console.log(error.code, error.message);
  }
}

const deleteItem = async id => {
  try {
    await deleteDoc(doc(db, "item", id));
    showMessage('Movimiento eliminado exitosamente.', 'text-bg-success');
    await initial();
  } catch (error) {
    console.log(error.code, error.message);
  };
};

const getItemEdit = async id => {
  refresh();
  try {
    const docRef = doc(db, "item", id);
    const docSnap = await getDoc(docRef);

    if(docSnap.exists()) {
      const data = docSnap.data();

      if(data.selectedCP == 'g'){
        if(data.integ){
          cp.value = Math.round(data.cp * 1000);
        } else{
          cp.value = Math.round(1000 * (data.cp * 1000)) / 1000;
        }
      }
      else if(data.selectedCP == 'tn'){
        if(data.integ){
          cp.value = Math.round(data.cp / 1000);
        } else {
          cp.value = Math.round(1000 * (data.cp / 1000)) / 1000;
        }
      } else {
        cp.value = data.cp;
      }

      if(data.typeCP === -1){
        cp.value *= -1;
        eS.value = 'Salida';
      } else {
        eS.value = 'Entrada';
      }

      selectedCP.value = data.selectedCP;
      fecha.value = data.fecha;
      hora.value = data.hora;
      empTrans.value = data.empTrans;
      empTrat.value = data.empTrat;
      com.value = data.com;
      intege.value = data.integ;
      currID.value = id;
    }

  } catch (error) {
    console.log(error.code, error.message);
  }
}

const edit = async() => {
  const myModal = document.getElementById('disEdit'); 

  try {
    if(cp.value !== null && cp.value !== '' && cp.value !== undefined && selectedCP.value !== null && selectedCP.value !== '' && selectedCP.value !== undefined && fecha.value !== null && fecha.value !== '' && fecha.value !== undefined && hora.value !== null && hora.value !== '' && hora.value !== undefined && (eS.value === 'Entrada' || eS.value === 'Salida')){
      if(selectedCP.value == 'g'){
        if(intege.value){
          cp.value = cp.value / 1000;
        } else {
          cp.value = (1000 * (cp.value / 1000) / 1000);
        }

      } else if(selectedCP.value == 'tn'){
        if(intege.value){
          cp.value = cp.value * 1000;
        } else {
          cp.value = (1000 * (cp.value * 1000) / 1000);
        }
      }

      if(eS.value === 'Salida'){
        cp.value *= -1;
      }

      adding.value = true;
      const docRef = doc(db, "item", currID.value);
      await updateDoc(docRef, {cp: cp.value, typeCP: Math.sign(cp.value), selectedCP: selectedCP.value, fecha: fecha.value, hora: hora.value, empTrans: empTrans.value, empTrat: empTrat.value, com: com.value});
      showMessage('Movimiento editado exitosamente.', 'text-bg-success');
      cp.value = selectedCP.value = fecha.value = hora.value = empTrans.value = empTrat.value = currID.value = com.value = eS.value = null;
      validate.value = 'needs-validation';
      await initial();
      myModal.click();
      adding.value = false;

    } else {
      showMessage('Complete los campos requeridos correctamente.', 'text-bg-danger');
      validate.value = 'was-validated';
    }

  } catch (error) {
    console.log(error.code, error.message);
  }
};

const sumFunc = async sum => {
  try {
    const q = query(collection(db, "desecho"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      editSum(doc.id, sum);
    });

  } catch (error) {
    console.log(error.code, error.message);    
  }
};

const editSum = async (id, sum) => {
  try {
    const docRef = doc(db, "desecho", id);
    await updateDoc(docRef, {cp: sum});

  } catch (error) {
    console.log(error.code, error.message); 
  }
};

const showData = (table, data, id) => {
  const rCP = ref(data.cp);
  if(data.selectedCP == 'g'){
    if(data.integ){
      rCP.value = Math.round(rCP.value * 1000);
    } else {
      rCP.value = Math.round(1000 * (rCP.value * 1000)) / 1000;
    }

  } else if(data.selectedCP == 'tn'){
    if(data.integ){
      rCP.value = Math.round(rCP.value / 1000);

    } else {
      rCP.value = Math.round(1000 * (rCP.value / 1000)) / 1000;
    }
  }

table.innerHTML +=`
                    <tr>
                      <td hidden>${id}</td>
                      <td class="text-center w-25">${getDateInfo(data.fecha)}</td>
                      <td class="text-center w-25">${data.hora}</td>
                      <td class="text-center w-25 color">${rCP.value} ${data.selectedCP}<i class="bi bi-trash float-end me-3" data-bs-toggle="modal" data-bs-target="#confirmacion" style="cursor: pointer;"></i><i class="bi bi-pencil float-end me-4" data-bs-toggle="modal" data-bs-target="#editItemModal" style="cursor: pointer;"></i><i class="bi bi-eye float-end me-4" data-bs-toggle="modal" data-bs-target="#infoItemModal" style="cursor: pointer"></i></td>
                    </tr>
                  `;
};

const testy = op => {
  if(op === 'Trans'){
    directoryTrans.value = !directoryTrans.value;
    racdaTrans.value = rifTrans.value = null;
    empTrans.value = '';

  } else {
    directoryTrat.value = !directoryTrat.value;
    racdaTrat.value = rifTrat.value = null;
    empTrat.value = '';
  }
};

const confir = bool => {
  conf.value = bool;
  setTimeout(() => {
    conf.value = '';
  }, 550);
};

const refresh = () => {
  cp.value = selectedCP.value = intege.value = fecha.value = hora.value = empTrans.value = empTrat.value = currID.value = com.value = eS.value = null;
  setTimeout(() => {
    directoryTrans.value = true;
    directoryTrat.value = true;
  }, 50);
  setTimeout(() => {
    directoryTrans.value = false;
    directoryTrat.value = false;
  }, 50);
};

const generatePDF = () => {
  const pdf = jsPDF();

  pdf.autoTable({ 
    html: '#pdftable-content', 
    startY: 33, 
    didDrawPage: data => {
      data.settings.margin.top = 33;
      pdf.setFontSize(8);
      pdf.setTextColor(40);

      pdf.text('Green Tree', 180, 5);
      pdf.setFontSize(13);
      pdf.text(`${userStore.userData.name}`, data.settings.margin.left, 9);
      pdf.setFontSize(11);
      pdf.text(`Desecho: ${nombreDesecho.value.desecho}`, data.settings.margin.left, 15);

      if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && (eDate.value == null || eDate.value == undefined || eDate.value == '')){
        pdf.text(`Desde: ${getDateInfo(sDate.value)}`, data.settings.margin.left, 20);

      } else if((sDate.value == null || sDate.value == undefined || sDate.value == '') && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
        pdf.text(`Hasta: ${getDateInfo(eDate.value)}`, data.settings.margin.left, 20);

      } else if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
        pdf.text(`Desde: ${getDateInfo(sDate.value)}, Hasta: ${getDateInfo(eDate.value)}`, data.settings.margin.left, 20);

      } else {
        pdf.text(`Fecha: ${getDateInfo(Date.now())}`, data.settings.margin.left, 20); 
      }

      pdf.text(`Movimientos: ${tipMov.value}`, data.settings.margin.left, 25);
      pdf.text(`Peso Total: ${Number.isInteger(sum.value) ? sum.value : parseFloat(sum.value.toFixed(4))} kg`, data.settings.margin.left, 30);

      var str = "" + pdf.getNumberOfPages();

      pdf.setFontSize(10);

      var pageSize = pdf.internal.pageSize;
      var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      pdf.text(str, 195, pageHeight - 10);
    } 
  });

  if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && (eDate.value == null || eDate.value == undefined || eDate.value == '')){
    pdf.save(`Reporte_${nombreDesecho.value.desecho}_d${getDateInfo(sDate.value)}.pdf`);

  } else if((sDate.value == null || sDate.value == undefined || sDate.value == '') && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
    pdf.save(`Reporte_${nombreDesecho.value.desecho}_h${getDateInfo(eDate.value)}.pdf`);

  } else if(sDate.value !== null && sDate.value !== undefined && sDate.value !== '' && eDate.value !== null && eDate.value !== undefined && eDate.value !== ''){
    pdf.save(`Reporte_${nombreDesecho.value.desecho}_${getDateInfo(sDate.value)}_${getDateInfo(eDate.value)}.pdf`);

  } else {
    pdf.save(`Reporte_${nombreDesecho.value.desecho}.pdf`);
  }
};

const showGraphic = () => {
  const ctx = document.getElementById('graphic');
  let chartStatus = Chart.getChart('graphic');
  if (chartStatus != undefined) {
      chartStatus.destroy();
  }
  let mA = [], mAG = [], mAR = [], uniquemA = [], uniquemAG = [], uniquemAR = [], cpmA = [];
  let cpmAG = [], cpmAR = [], all = [], green = [], red = [], finalmAG = [], finalmAR = [];
  let data = {};

  allFiltData.forEach(i => {
    if((tipMov.value !== 'Todos')){
      mA.push(getMA(i.fecha));
      cpmA.push({cp: i.cp, fecha: getMA(i.fecha)});
    } else {
      cpmA.push({cp: i.cp, fecha: getMA(i.fecha), type: i.typeCP});
    }
  });

  if((tipMov.value !== 'Todos')){
    cpmA.reverse();
    all = critPoints(cpmA);
    if(all.length > 12){
      all = all.slice(-12);
    }
  } else {
    cpmA.forEach(i => {
      if(i.type == 1){
        cpmAG.push(i);
        mAG.push(i.fecha);
      } else {
        cpmAR.push(i);
        mAR.push(i.fecha);
      }
    });
    cpmAG.reverse();
    cpmAR.reverse();
    green = critPoints(cpmAG);
    red = critPoints(cpmAR);

    if(green.length > 12){
      green = green.slice(-12);
    }
    if(red.length > 12){
      red = red.slice(-12);
    }
  }

  if(tipMov.value !== 'Todos'){
    uniquemA = [...new Set(mA)];
    if(uniquemA.length > 12){
      uniquemA.length = 12;
    }
    uniquemA.reverse();
  } else {
    uniquemAG = [...new Set(mAG)];
    if(uniquemAG.length > 12){
      uniquemAG.length = 12;
    }
    uniquemAG.reverse();
    for(let i = 0; i < uniquemAG.length; i++){
      finalmAG.push({x: uniquemAG[i], y: green[i]}); 
    }

    uniquemAR = [...new Set(mAR)];
    if(uniquemAR.length > 12){
      uniquemAR.length = 12;
    }
    uniquemAR.reverse();
    for(let i = 0; i < uniquemAR.length; i++){
      finalmAR.push({x: uniquemAR[i], y: red[i]}); 
    }
  }

  if(tipMov.value !== 'Todos'){
    data = {
      labels: uniquemA,
      datasets: [
        {
        label: tipMov.value,
        data: all,
        fill: false,
        borderColor: tipMov.value == 'Entradas' ? 'rgb(25, 135, 84)' : 'rgb(220, 53, 69)',
        backgroundColor: tipMov.value == 'Entradas' ? 'rgb(209, 231, 221)' : 'rgb(248, 215, 218)',
        tension: 0.1
        }
      ]
    }
  } else {
    data = {
      datasets: [
        {
        label: 'Entradas',
        data: green,
        fill: false,
        borderColor: 'rgb(25, 135, 84)',
        backgroundColor: 'rgb(209, 231, 221)',
        xAxisID: 'x1',
        tension: 0.1
        },
        {
        label: 'Salidas',
        data: red,
        fill: false,
        borderColor: 'rgb(220, 53, 69)',
        backgroundColor: 'rgb(248, 215, 218)',
        xAxisID: 'x2',
        tension: 0.1
        }
      ]
    }
  }

  new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      plugins: {
        tooltip: {
        yAlign: 'bottom',
        callbacks: {
          label(tooltipItems) {
            return `${tooltipItems.formattedValue} kg`;
            }
          }
        },
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Gráfico'
        }
      },
      scales: {
        x: {
          title: {
            display: tipMov.value == 'Todos' ? false : true,
            text: 'Mes-Año',
          },
        },
        x1: {
          display: tipMov.value !== 'Todos' ? false : true,
          title: {
            display: true,
            text: 'Mes-Año (Entradas)',
          },
          position: 'top',
          labels: uniquemAG,
        },
        x2: {
          display: tipMov.value !== 'Todos' ? false : true,
          title: {
            display: true,
            text: 'Mes-Año (Salidas)',
          },
          position: 'bottom',
          labels: uniquemAR,
          grid: {
          },
        },
        y: {
          title: {
            display: true,
            text: 'Kg'
          }
        }
      }
    }
  });
};

const getMA = date => {
  let mes = new Date(date).getUTCMonth() + 1;
  if(mes < 10){
    mes = '0' + mes;
  }
  const format = `${mes}-${new Date(date).getUTCFullYear()}`;
  return format;
};

const critPoints = data => {
  let next = {}, actual = {};
  let finalCP = [];
  let addCP = 0;

  for(let i = 0; i < data.length; i++){
    actual = data[i];

    if(data.length - 1 == i){
      next = {};
      if(addCP !== 0) {
        finalCP.push(addCP);
      } else {
        addCP = actual.cp;
        finalCP.push(addCP);
      }
    } else {
      next = data[i+1];

      if(i == 0 && actual.fecha == next.fecha){
        addCP += actual.cp + next.cp;
      } else if(i == 0 && actual.fecha !== next.fecha){
        addCP = actual.cp;
        finalCP.push(addCP);
        addCP = next.cp;
      } else if(actual.fecha == next.fecha){
        addCP += next.cp;
      } else {
        if(addCP !== 0){
          finalCP.push(addCP);
        }
        addCP = next.cp;
      }
    }
  }
  return finalCP;
};

// const newField = async () => {
//   try {
//     const q = query(collection(db, "item"));
//     const querySnapshot = await getDocs(q);

//     querySnapshot.forEach(document => {
//       const data = document.data();
//       const docRef = doc(db, "item", document.id);
//       updateDoc(docRef, {typeCP: Math.sign(data.cp)});
//     });

//   } catch (error) {
//     console.log(error.code, error.message);
//   }
// }

onMounted(() => {
  // newField();
  getName();
  getItems();
  initial();
});
</script>

<template>
  <div class="container">
    <div class="d-inline-block d-xxl-none">
      <RouterLink class="btn btn-primary mt-1 mt-xxl-4" to="/"><i class="bi bi-arrow-left" style="font-size: 20px;"></i></RouterLink>
    </div>

    <div class="d-none d-xxl-flex">
      <RouterLink class="btn btn-primary mt-3 mt-xxl-4" to="/"><i class="bi bi-arrow-left" style="font-size: 20px;"></i></RouterLink>
      <div class="d-xxl-flex ms-auto mt-auto d-none">
        <div class="cuadrado-g rounded-circle"></div>
        <div class="ms-1 pt-1 mt-2">Entrada</div>
        <div class="cuadrado-r ms-5 rounded-circle"></div>
        <div class="ms-1 pt-1 mt-2">Salida</div>
      </div>
      <button v-if="userStore.wait == 1" class="btn btn-primary ms-auto mt-3 mt-xxl-4" type="button" data-bs-toggle="modal" data-bs-target="#newItemModal" @click="refresh"><i class="bi bi-plus-lg" style="font-size: 20px;"></i></button>
      <p v-if="userStore.wait == 2" class="text-danger ms-auto mt-3 mt-xxl-4">Renueve el Racda</p>
      <p v-if="userStore.wait == 3" class="text-warning ms-auto mt-3 mt-xxl-4">Ingrese el Racda</p>
    </div>

    <p class="text-center mt-4 mb-1 lead d-none d-xxl-block">{{nombreDesecho?.desecho}}</p>
    <p class="text-center lead mb-4 d-none d-xxl-block">Peso Total: <span v-if="!hideCP">{{Number.isInteger(sum) ? sum : parseFloat(sum.toFixed(4))}} kg</span><span v-else>0 kg</span></p>
    <p class="ss mt-1 lead d-xxl-none">{{nombreDesecho?.desecho}}</p>
    <p class="sc lead mb-4 pb-3 d-xxl-none">Peso Total: <span v-if="!hideCP">{{Number.isInteger(sum) ? sum : parseFloat(sum.toFixed(4))}} kg</span><span v-else>0 kg</span></p>
    <div class="d-inline-flex d-xxl-none ps-5 ms-5">
      <div class="cuadrado-g ts rounded-circle"></div>
      <div class="ms-1 pt-3 mt-3">Entrada</div>
      <div class="cuadrado-r ts ms-5 rounded-circle"></div>
      <div class="ms-1 pt-3 mt-3">Salida</div>
    </div>
    <button v-if="userStore.wait == 1" class="btn btn-primary d-xxl-none float-end" style="margin-top: 1.6rem" type="button" data-bs-toggle="modal" data-bs-target="#newItemModal" @click="refresh"><i class="bi bi-plus-lg" style="font-size: 20px;"></i></button>
    <div class="d-flex float-start ">
      <div class="col-3 me-xl-5 me-3 ps-xxl-5 pe-5 pe-xl-4" style="margin-left: 5.2rem!important">
      <VueMultiselect
                  v-model="tipMov"
                  :options="movOptions"
                  :searchable="false"
                  :allow-empty="false"
                  :show-labels="false"
                  placeholder="Todos"
                  @select="initial"
      />
      </div>
      <div class="mb-0 mb-xxl-4 col-9">
        <label for="startDate" class="ms-2 ms-xl-3 ms-xxl-4 ps-xxl-1 form-label lead">Desde:</label>
        <input type="date" class="ms-1 me-3 form-control cw" id="startDate" v-model="sDate" @change="initial">
        <label for="endDate" class="form-label lead">Hasta:</label>
        <input type="date" class="ms-1 form-control cw" id="endDate" v-model="eDate" @change="initial">
        <button class="btn btn-primary ms-4 ms-xxl-5" @click="generatePDF" type="button"><i class="bi bi-printer"></i></button>
        <button class="btn btn-primary ms-4 ms-xxl-3" type="button" data-bs-toggle="modal" data-bs-target="#graphicModal" @click="showGraphic"><i class="bi bi-bar-chart-fill"></i></button>
      </div>
    </div>

    <div class="modal fade" id="newItemModal" tabindex="-1" aria-labelledby="newItemModal" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="newItemModalLabel">Movimiento de desecho</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="checkData" :class="`row g-3 ${validate}`" novalidate>
              <div class="col-3 mt-3">
                <label for="fecha" class="form-label">Fecha*</label>
                <input type="date" :class="`form-control ${sf}`" id="fecha" v-model="fecha" required>
              </div>
              <div class="col-3 mt-3">
                <label for="hora" class="form-label">Hora*</label>
                <input type="time" :class="`form-control ${sh}`" id="hora" v-model="hora" required>
              </div>
              <div class="col-3 mt-3">
                <label for="CP" class="form-label">Peso*</label>
                <input type="number" min="0.001" step="0.001" :class="`form-control ${scp}`" id="CP" oninput="validity.valid||(value='');" v-model="cp" required>
              </div>
              <div :class="`col-1 mt-3 ${su}`">
                <label class="form-label">Unidad*</label>
                <VueMultiselect
                v-model="selectedCP"
                :options="cpOptions"
                :allow-empty="false"
                :show-labels="false"
                placeholder="..."
                />
              </div>
              <div class="col-2 mt-3 ps-4">
                <label class="form-check-label">Tipo*</label>
                <div class="form-check mt-1">
                  <input class="form-check-input" type="radio" name="entsal" id="entrada" value="Entrada" v-model="eS">
                  <label class="form-check-label" for="entrada">
                    Entrada
                  </label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="entsal" id="salida" value="Salida" v-model="eS">
                  <label class="form-check-label" for="salida">
                    Salida
                  </label>
                </div>
              </div>
              <div v-if="!directoryTrans" class="col-5">
                <label for="trans" class="form-label">Empresa de Transporte</label>
                <VueMultiselect
                v-model="empTrans"
                :options="daTransFilt"
                :show-labels="false"
                placeholder="..."
                />
              </div>
              <div v-if="directoryTrans" class="col-3">
                <label for="inputNameRif" class="form-label">Rif - Emp. Transporte*</label>
                <div class="input-group">
                  <span class="input-group-text">J-</span>
                  <input type="number" class="form-control" min="0" max="999999999" oninput="validity.valid||(value='');" id="inputNameRif" v-model="rifTrans" required>
                </div>
              </div>
              <div class="col-1 mt-5 text-center">
                <i v-if="!directoryTrans" class="bi bi-pencil-square" style="font-size: 25px; cursor: pointer" @click="testy('Trans')"></i>
                <i v-else class="bi bi-folder" style="font-size: 25px; cursor: pointer" @click="testy('Trans')"></i>
              </div>
              <div v-if="directoryTrat && !directoryTrans" class="col-6"></div>
              <div v-if="directoryTrans" class="col-3">
                <label for="racTrans" class="form-label">Venc. RACDA*</label>
                <input type="date" class="form-control" id="racTrans" v-model="racdaTrans" required>
              </div>
              <div v-if="directoryTrans" class="col-5">
                <label for="trans" class="form-label">Empresa de Transporte*</label>
                <input type="text" class="form-control" id="trans" v-model="empTrans" required>
              </div>
              <div v-if="!directoryTrat" class="col-5">
                <label for="trat" class="form-label">Empresa Tratante</label>
                <VueMultiselect
                v-model="empTrat"
                :options="daTratFilt"
                :show-labels="false"
                placeholder="..."
                />
              </div>
              <div v-if="directoryTrat" class="col-3">
                <label for="inputNameRif" class="form-label">Rif - Emp. Tratante*</label>
                <div class="input-group">
                  <span class="input-group-text">J-</span>
                  <input type="number" class="form-control" min="0" max="999999999" oninput="validity.valid||(value='');" id="inputNameRif" v-model="rifTrat" required>
                </div>
              </div>
              <div class="col-1 mt-5 text-center">
                <i v-if="!directoryTrat" class="bi bi-pencil-square" style="font-size: 25px; cursor: pointer" @click="testy('Trat')"></i>
                <i v-else class="bi bi-folder" style="font-size: 25px; cursor: pointer" @click="testy('Trat')"></i>
              </div>
              <div v-if="directoryTrat" class="col-3">
                <label for="racTrat" class="form-label">Venc. RACDA*</label>
                <input type="date" class="form-control" id="racTrat" v-model="racdaTrat" required>
              </div>
              <div v-if="directoryTrat" class="col-5">
                <label for="trat" class="form-label">Empresa Tratante*</label>
                <input type="text" class="form-control" id="trat" v-model="empTrat" required>
              </div>
              <div class="form-group">
                <label for="exampleFormControlTextarea1">Comentario</label>
                <textarea class="form-control" id="exampleFormControlTextarea1" maxlength="100" rows="2" v-model="com"></textarea>
              </div>
              <div class="modal-footer">
                <span class="me-auto mb-auto">(*) = campo requerido.</span>
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
        
    <div class="modal fade" id="editItemModal" tabindex="-1" aria-labelledby="editItemModal" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="editItemModalLabel">Modificar movimiento</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="edit" :class="`row g-3 ${validate}`" novalidate>
              <div class="col-3 mt-3">
                <label for="fecha" class="form-label">Fecha*</label>
                <input type="date" :class="`form-control ${sf}`" id="fecha" v-model="fecha" required>
              </div>
              <div class="col-3 mt-3">
                <label for="hora" class="form-label">Hora*</label>
                <input type="time" :class="`form-control ${sh}`" id="hora" v-model="hora" required>
              </div>
              <div class="col-3 mt-3">
                <label for="CP" class="form-label">Peso*</label>
                <input type="number" min="0.001" step="0.001" :class="`form-control ${scp}`" id="CP" oninput="validity.valid||(value='');" v-model="cp" required>
              </div>
              <div :class="`col-1 mt-3 ${su}`">
                <label class="form-label">Unidad*</label>
                <VueMultiselect
                v-model="selectedCP"
                :options="cpOptions"
                :allow-empty="false"
                :show-labels="false"
                placeholder="..."
                />
              </div>
              <div class="col-2 mt-3 ps-4">
                <label class="form-check-label">Tipo*</label>
                <div class="form-check mt-1">
                  <input class="form-check-input" type="radio" name="entsal" id="entrada" value="Entrada" v-model="eS">
                  <label class="form-check-label" for="entrada">
                    Entrada
                  </label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="entsal" id="salida" value="Salida" v-model="eS">
                  <label class="form-check-label" for="salida">
                    Salida
                  </label>
                </div>
              </div>
              <div class="col-6">
                <label for="trans" class="form-label">Empresa de Transporte</label>
                <VueMultiselect v-if="!directoryTrans"
                v-model="empTrans"
                :options="daTransFilt"
                :show-labels="false"
                placeholder="..."
                />
              </div>
              <div class="col-6">
                <label for="trat" class="form-label">Empresa Tratante</label>
                <VueMultiselect v-if="!directoryTrat"
                v-model="empTrat"
                :options="daTratFilt"
                :show-labels="false"
                placeholder="..."
                />
              </div>
              <div class="form-group">
                <label for="exampleFormControlTextarea1">Comentario</label>
                <textarea class="form-control" id="exampleFormControlTextarea1" maxlength="100" rows="2" v-model="com"></textarea>
              </div>
              <div class="modal-footer">
                <span class="me-auto mb-auto">(*) = campo requerido.</span>
                <button v-if ="!adding" type="submit" class="btn btn-primary">Editar</button>
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

    <div class="modal fade" id="infoItemModal" tabindex="-1" aria-labelledby="infoItemModal" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="infoItemModalLabel">Información</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="" :class="`row g-3 ${validate}`" novalidate>
              <div class="col-6 mt-3">
                <label for="CP" class="form-label">Peso</label>
                <input type="number" step="0.001" :class="`form-control ${scp}`" id="CP" v-model="cp" readonly required>
              </div>
              <div :class="`col-2 mt-3 ${su}`">
                <label for="unidades" class="form-label">Unidad</label>
                <input type="text" class="form-control" id="unidades" v-model="selectedCP" readonly required>
              </div>
              <div class="col-3 mt-3 ps-5">
                <label class="form-check-label">Tipo</label>
                <div class="form-check mt-1">
                  <input class="form-check-input" type="radio" name="entsal" id="entrada" value="Entrada" v-model="eS" disabled>
                  <label class="form-check-label" for="entrada">
                    Entrada
                  </label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="entsal" id="salida" value="Salida" v-model="eS" disabled>
                  <label class="form-check-label" for="salida">
                    Salida
                  </label>
                </div>
              </div>
              <div class="col-8 mt-3">
                <label for="fecha" class="form-label">Fecha</label>
                <input type="date" :class="`form-control ${sf}`" id="fecha" v-model="fecha" readonly required>
              </div>
              <div class="col-1"></div>
              <div class="col-3 mt-3">
                <label for="hora" class="form-label">Hora</label>
                <input type="time" :class="`form-control ${sh}`" id="hora" v-model="hora" readonly required>
              </div>
              <div class="col-6">
                <label for="trans" class="form-label">Empresa de Transporte</label>
                <input type="text" class="form-control" id="trans" v-model="empTrans" readonly required>
              </div>
              <div class="col-6">
                <label for="trat" class="form-label">Empresa Tratante</label>
                <input type="text" class="form-control" id="trat" v-model="empTrat" readonly required>
              </div>
              <div class="form-group">
                <label for="exampleFormControlTextarea1">Comentario</label>
                <textarea class="form-control" id="exampleFormControlTextarea1" maxlength="60" rows="2" v-model="com" readonly required></textarea>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="graphicModal" tabindex="-1" aria-labelledby="graphicModal" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-body">
            <canvas id="graphic"></canvas>
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

    <table class="table table-hover table-fixed">
      <thead>
        <tr>
          <th scope="col" class="text-center w-25">Fecha</th>
          <th scope="col" class="text-center w-25">Hora</th>
          <th scope="col" class="d-xxl-table-cell d-xxl-none ps w-25">Peso</th>
          <th scope="col" class="d-none d-xxl-table-cell pc w-25">Peso</th>
        </tr>
      </thead>
      <div class="mt-3" :hidden=!spac><br><br><br><br><br><br><br><br><br><br><br></div>
      <tbody id="table-content" :hidden=spac></tbody>
    </table>
    <table id="pdftable-content" hidden>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Hora</th>
          <th>Peso</th>
        </tr>
      </thead>
      <tbody id="content"></tbody>
    </table>
    <div class="d-flex justify-content-center" id="but">
      <div class="btn-group" role="group" aria-label="Basic example">
        <button type="button" class="btn btn-primary" @click="prev" :disabled="previousDisabled">Atrás</button>
        <button type="button" class="btn btn-primary" @click="next" :disabled="nextDisabled">Siguiente</button>
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
            <p>Se eliminará el registro.</p>
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
  margin-left: 1px;
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
    right: -35% !important;
}

.invalid .multiselect__tags {
  border-color: #f04124!important;
}

.valid .multiselect__tags {
  border-color: #198754!important;
}

.ss {
  display: inline-block;
  margin-left: 3rem;
  margin-right: 2.5rem;
  transform: translateY(27%);
}

.sc {
  display: inline-block;
  transform: translateY(20%);
}

.pc {
  padding-left: 9rem !important;
}

.ps {
  padding-left: 5.2rem !important;
}

.cw {
  display: inline;
  width: auto;
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

.ts {
  transform: translateY(40%);
}
</style>