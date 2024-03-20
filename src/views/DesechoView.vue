<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useRoute} from 'vue-router'
import {db} from '../firebaseConfig';
import {doc, getDoc, getDocs, deleteDoc, query, where, collection, orderBy, addDoc, updateDoc, limit, startAfter, limitToLast, endBefore, DocumentData} from 'firebase/firestore'; 
import {useUserStore} from '../stores/user';
import {useMix} from '../composables/mix';
import VueMultiselect from 'vue-multiselect';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {Chart, ChartData} from 'chart.js/auto';

const userStore = useUserStore();
const {getDateInfo, showMessage, res, msgColor} = useMix();

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
const nextDisabled = ref(true);
const previousDisabled = ref(true);
const hideCP = ref(false);
const com = ref('');
const empTrans = ref('');
const empTrat = ref('');
const su = ref('');
const sDate = ref('');
const eDate = ref('');
const id = ref('');
const showArray = ref([]), showPdfArray = ref([]);
const sum = ref(0);
const validate = ref('needs-validation');
const tipMov = ref('Todos');
let dat = [], daTrans = [], daTrat = [], daTransFilt = [], daTratFilt = [], qts = [], movArray = [];
let lastVisible = null, firstVisible = null;
const N_ITEM = 7;
const CP_OPTIONS = ['g', 'kg', 'tn'];
const MOV_OPTIONS = ['Todos', 'Entradas', 'Salidas'];

const route = useRoute();

const getName = async () => { // Obtiene la información del desecho seleccionado por el usuario de la base de datos.
  try {
    const q = query(collection(db, "desecho"), where("uid", "==", userStore.userData.uid));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => dat.push({... doc.data()}));
    nombreDesecho.value = dat.find(item => item.desechoID === route.params.name);
    dat.length = 0;
  } catch (e) {
    console.log(e.message);
  }
};

const getItems = async () => { // Obtiene el nombre de las empresas registradas con racda vigente y las almacena en arreglos locales.
  try {
    daTrans.length = 0, daTransFilt.length = 0, daTrat.length = 0, daTratFilt.length = 0;
    let q = query(collection(db, "empTrans"), where("uid", "==", userStore.userData.uid), orderBy("name"));
    let querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => daTrans.push({... doc.data()}));

    daTrans = daTrans.filter(item => new Date(item.venc).getTime() > Date.now());
    daTrans.forEach(i => daTransFilt.push(i.name));

    q = query(collection(db, "empTrat"), where("uid", "==", userStore.userData.uid), orderBy("name"));
    querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => daTrat.push({... doc.data()}));

    daTrat = daTrat.filter(item => new Date(item.venc).getTime() > Date.now());
    daTrat.forEach(i => daTratFilt.push(i.name));
  } catch (e) {
    console.log(e.message);
  }
};

const checkData = async () => { // Valida los datos del formulario.
  try {
    selectedCP.value ? su.value = 'valid' : su.value = 'invalid';

    if(cp.value && selectedCP.value && fecha.value && hora.value && eS.value){
      const foundRep = movArray.find(i => i.fecha === fecha.value && i.hora === hora.value);

      if(!foundRep) {
        if(racdaTrans.value && racdaTrat.value){
          if(new Date(racdaTrans.value).getTime() > Date.now() && new Date(racdaTrat.value).getTime() > Date.now())
            await getData();
          else
            showMessage('Racda de empresa vencido.', 'text-bg-danger');
        } else if(!racdaTrans.value && !racdaTrat.value){
          await getData();
        } else if(racdaTrans.value){
          if(new Date(racdaTrans.value).getTime() > Date.now())
            await getData();
          else
            showMessage('Racda de empresa vencido.', 'text-bg-danger');
        } else if(racdaTrat.value){
          if(new Date(racdaTrat.value).getTime() > Date.now())
            await getData();
          else
          showMessage('Racda de empresa vencido.', 'text-bg-danger');
        }
      } else {
        showMessage('Ya existe un movimiento con la misma fecha y hora.', 'text-bg-danger');
      }
    } else {
      showMessage('Complete los campos requeridos correctamente.', 'text-bg-danger');
      validate.value = 'was-validated';
    }
  } catch (e) {
    console.log(e.message);
  }
};

const getData = async () => { // Prepara y almacena toda la información del movimiento en un objeto.
  try {                       
    const isInteg = Number.isInteger(cp.value); // Indica si el número es un entero o un float.
    const inputData = ref(null);
    adding.value = true;

    if(selectedCP.value === 'g') cp.value /= 1000; // Hace las conversiones necesarias para pasar todo a kg.
    else if(selectedCP.value === 'tn') cp.value *= 1000; 
    
    if(eS.value === 'Salida') cp.value *= -1; // Si el movimiento es una salida se pone el peso negativo.

    if(!empTrans.value) empTrans.value = ''; // En caso de no indicar ninguna empresa se guardan los campos vacios.
    if(!empTrat.value) empTrat.value = '';

    inputData.value = {desecho: nombreDesecho.value.desecho, desechoID: route.params.name, cp: cp.value, typeCP: Math.sign(cp.value), selectedCP: selectedCP.value, integ: isInteg, fecha: fecha.value, hora: hora.value, empTrans: empTrans.value, empTrat: empTrat.value, com: com.value, uid: userStore.userData.uid};
    await addItem(inputData.value);
    
    su.value = '', validate.value = 'needs-validation';
    cp.value = selectedCP.value = fecha.value = hora.value = racdaTrans.value = racdaTrat.value = rifTrans.value = rifTrat.value = eS.value = null;
    empTrans.value = empTrat.value = com.value = '';
    await initial();
  } catch (e) {
    console.log(e.message);
  }
};

const addItem = async data => { // Registra el movimiento en la base de datos y registra en caso necesario las empresas de servicio que no estén.
  try {
    await addDoc(collection(db, "item"), data); // Registro del movimiento en la base de datos.
    showMessage('Movimiento registrado exitosamente.', 'text-bg-success');

    if(rifTrans.value || rifTrat.value){ // En caso de indicar alguna empresa manualmente, se registra si no está en la base de datos.
      const q = query(collection(db, "empTrans"), where("uid", "==", userStore.userData.uid), where("rif", "==", rifTrans.value));
      const qs = query(collection(db, "empTrat"), where("uid", "==", userStore.userData.uid), where("rif", "==", rifTrat.value));

      if(rifTrans.value && rifTrat.value){
        const querySnapshot = await getDocs(q);
        const querySnap = await getDocs(qs);

        if(querySnapshot.empty === true && querySnap.empty === true){
          await addDoc(collection(db, "empTrans"), {name: empTrans.value, rif: rifTrans.value, venc: racdaTrans.value, uid: userStore.userData.uid});
          await addDoc(collection(db, "empTrat"), {name: empTrat.value, rif: rifTrat.value, venc: racdaTrat.value, uid: userStore.userData.uid});
          showMessage('Empresas registradas exitosamente.', 'text-bg-success');
          await getItems();
        }
      } else if(rifTrans.value){
        const querySnapshot = await getDocs(q);

        if(querySnapshot.empty === true){
          await addDoc(collection(db, "empTrans"), {name: empTrans.value, rif: rifTrans.value, venc: racdaTrans.value, uid: userStore.userData.uid});
          await getItems();
          showMessage('Empresa de Transporte registrada exitosamente.', 'text-bg-success');
        }
      } else if(rifTrat.value){
        const querySnap = await getDocs(qs);

        if(querySnap.empty === true){
          await addDoc(collection(db, "empTrat"), {name: empTrat.value, rif: rifTrat.value, venc: racdaTrat.value, uid: userStore.userData.uid});
          await getItems();
          showMessage('Empresa de Tratamiento registrada exitosamente.', 'text-bg-success');
        }
      }
    }
  } catch (e) {
    console.log(e.message);
  }
};

const initial = async () => { // Consulta en la base de datos los movimientos del desecho para luego mostrarlos
  try {               
    previousDisabled.value = true, nextDisabled.value = true;
    movArray.length = 0;

    let q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), orderBy("fecha", "desc"), orderBy("hora", "desc"));
    let querySnapshot = await getDocs(q);

    sum.value = 0;
    if(tipMov.value !== 'Todos') hideCP.value = true;
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      movArray.push({... data, id: doc.id});
      sum.value += data.cp;
    });

    await sumFunc(sum.value);

    if(sDate.value && !eDate.value){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(N_ITEM));
        qts = movArray.filter(i => i.typeCP === 1 && new Date(i.fecha) >= new Date(sDate.value));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(N_ITEM));
        qts = movArray.filter(i => i.typeCP === -1 && new Date(i.fecha) >= new Date(sDate.value));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(N_ITEM));
        qts = movArray.filter(i => new Date(i.fecha) >= new Date(sDate.value));
      }

    } else if(!sDate.value && eDate.value){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(N_ITEM));
        qts = movArray.filter(i => i.typeCP === 1 && new Date(i.fecha) <= new Date(eDate.value));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(N_ITEM));
        qts = movArray.filter(i => i.typeCP === -1 && new Date(i.fecha) <= new Date(eDate.value));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(N_ITEM));
        qts = movArray.filter(i => new Date(i.fecha) <= new Date(eDate.value));
      }

    } else if(sDate.value && eDate.value){
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(N_ITEM));
        qts = movArray.filter(i => i.typeCP === 1 && new Date(i.fecha) >= new Date(sDate.value) && new Date(i.fecha) <= new Date(eDate.value));
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(N_ITEM));
        qts = movArray.filter(i => i.typeCP === -1 && new Date(i.fecha) >= new Date(sDate.value) && new Date(i.fecha) <= new Date(eDate.value));
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(N_ITEM));
        qts = movArray.filter(i => new Date(i.fecha) >= new Date(sDate.value) && new Date(i.fecha) <= new Date(eDate.value));
      }

    } else {
      if(tipMov.value == 'Entradas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(N_ITEM));   
        qts = movArray.filter(i => i.typeCP === 1); 
      } else if(tipMov.value == 'Salidas'){
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(N_ITEM));    
        qts = movArray.filter(i => i.typeCP === -1);        
      } else {
        q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), orderBy("fecha", "desc"), orderBy("hora", "desc"), limit(N_ITEM));
        qts = movArray;
      }
    }

    showArray.value.length = 0;
    querySnapshot = await getDocs(q);
    adding.value = false;

    querySnapshot.forEach(doc => {
      const data = doc.data();
      showArray.value.push({... data, rCP: cpShowConvert(data), id: doc.id});
    });

    showPdfArray.value.length = 0;
    sum.value = 0;

    qts.forEach(mov => {
      showPdfArray.value.push({... mov, rCP: cpShowConvert(mov)});
      sum.value += mov.cp;
    });

    hideCP.value = false;

    if(querySnapshot.docs.length === 7){
      lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));
      querySnapshot = await getDocs(q);
      if(querySnapshot.docs.length >= 1) nextDisabled.value = false;
    }
  } catch (e) {
    console.log(e.message);
  }
};

const next = async () => { // Consulta en la base de datos los siguientes movimientos para luego muestrarlos
  try {
    nextDisabled.value = true, previousDisabled.value = true;
    let q;

    const nextQuery = () => {
      if(sDate.value && !eDate.value){
        if(tipMov.value == 'Entradas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));
        } else if(tipMov.value == 'Salidas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));
        } else {
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));
        }

      } else if(!sDate.value && eDate.value){
        if(tipMov.value == 'Entradas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));
        } else if(tipMov.value == 'Salidas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));
        } else {
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));
        }

      } else if(sDate.value && eDate.value){
        if(tipMov.value == 'Entradas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));
        } else if(tipMov.value == 'Salidas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));
        } else {
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));
        }    

      } else {
        if(tipMov.value == 'Entradas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));
        } else if(tipMov.value == 'Salidas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));
        } else {
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), orderBy("fecha", "desc"), orderBy("hora", "desc"), startAfter(lastVisible), limit(N_ITEM));      
        }
      }
    }

    nextQuery();
    showArray.value.length = 0;
    let querySnapshot = await getDocs(q);
    adding.value = false;

    lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    querySnapshot.forEach(doc => {
      const data: DocumentData = doc.data();
      showArray.value.push({... data, rCP: cpShowConvert(data), id: doc.id});
    });

    if(querySnapshot.docs.length === 7)
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 7];
    else if(querySnapshot.docs.length === 6)
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 6];
    else if(querySnapshot.docs.length === 5)
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 5];
    else if(querySnapshot.docs.length === 4)
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 4];
    else if(querySnapshot.docs.length === 3)
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 3];
    else if(querySnapshot.docs.length === 2)
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 2];
    else if(querySnapshot.docs.length === 1)
      firstVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    nextQuery();
    querySnapshot = await getDocs(q);
    previousDisabled.value = false;
    if(querySnapshot.docs.length > 0) nextDisabled.value = false;
  } catch (e) {
    console.log(e.message);
  }
};

const prev = async () => { // Consulta en la base de datos los movimientos anteriores para luego mostrarlos.
  try {
    previousDisabled.value = true, nextDisabled.value = true;
    let q;

    const prevQuery = () => {
      if(sDate.value && !eDate.value){
        if(tipMov.value == 'Entradas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(N_ITEM));
        } else if(tipMov.value == 'Salidas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(N_ITEM));
        } else {
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(N_ITEM));
        }

      } else if(!sDate.value && eDate.value){
        if(tipMov.value == 'Entradas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(N_ITEM));
        } else if(tipMov.value == 'Salidas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(N_ITEM));
        } else {
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(N_ITEM));
        }

      } else if(sDate.value && eDate.value){
        if(tipMov.value == 'Entradas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(N_ITEM));
        } else if(tipMov.value == 'Salidas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(N_ITEM));
        } else {
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("fecha", ">=", sDate.value), where("fecha", "<=", eDate.value), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(N_ITEM));
        }

      } else {
        if(tipMov.value == 'Entradas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", 1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(N_ITEM));
        } else if(tipMov.value == 'Salidas'){
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), where("typeCP", "==", -1), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(N_ITEM));
        } else {
          q = query(collection(db, "item"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name), orderBy("fecha", "desc"), orderBy("hora", "desc"), endBefore(firstVisible), limitToLast(N_ITEM));
        }
      }
    }

    prevQuery();
    showArray.value.length = 0;
    let querySnapshot = await getDocs(q);
    adding.value = false;

    lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    firstVisible = querySnapshot.docs[querySnapshot.docs.length - 7];
    
    querySnapshot.forEach(doc => {
      const data: DocumentData = doc.data();
      showArray.value.push({... data, rCP: cpShowConvert(data), id: doc.id});
    });

    prevQuery();
    querySnapshot = await getDocs(q);
    nextDisabled.value = false;
    if(querySnapshot.docs.length > 0) previousDisabled.value = false;
  } catch (e) {
    console.log(e.message);
  }
}

const cpShowConvert = data => { // convierte el cp antes de mostrarlo.
  const rCP = ref(data.cp);

  if(data.selectedCP === 'g'){
    if(data.integ) rCP.value = Math.round(rCP.value * 1000);
    else rCP.value = Math.round(1000 * (rCP.value * 1000)) / 1000;
  } else if(data.selectedCP === 'tn'){
    if(data.integ) rCP.value = Math.round(rCP.value / 1000);
    else rCP.value = Math.round(1000 * (rCP.value / 1000)) / 1000;
  }
  return rCP.value;
}

const deleteItem = async id => { // Borra el movimiento de la base de datos.
  try {
    await deleteDoc(doc(db, "item", id));
    showMessage('Movimiento eliminado exitosamente.', 'text-bg-success');
    await initial();
  } catch (e) {
    console.log(e.message);
  }
};

const getItemEdit = async id => { // Trae la información de un movimiento de la base de datos.
  try {
    refresh();

    const docRef = doc(db, "item", id);
    const docSnap = await getDoc(docRef);

    if(docSnap.exists()) {
      const data = docSnap.data();

      if(data.selectedCP == 'g')
        data.integ ? cp.value = Math.round(data.cp * 1000) : cp.value = Math.round(1000 * (data.cp * 1000)) / 1000;
      else if(data.selectedCP == 'tn')
        data.integ ? cp.value = Math.round(data.cp / 1000) : cp.value = Math.round(1000 * (data.cp / 1000)) / 1000;
      else 
        cp.value = data.cp;

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
  } catch (e) {
    console.log(e.message);
  }
}

const edit = async () => { // Edita un movimiento de la base de datos.
  try {
    const myModal = document.getElementById('disEdit'); 

    if(cp.value && selectedCP.value && fecha.value && hora.value && (eS.value === 'Entrada' || eS.value === 'Salida')){
      if(selectedCP.value === 'g'){
        if(intege.value) cp.value = cp.value / 1000;
        else cp.value = (1000 * (cp.value / 1000) / 1000);

      } else if(selectedCP.value === 'tn'){
        if(intege.value) cp.value = cp.value * 1000;
        else cp.value = (1000 * (cp.value * 1000) / 1000);
      }

      if(eS.value === 'Salida') cp.value *= -1;

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

  } catch (e) {
    console.log(e.message);
  }
};

const sumFunc = async sum => { // Busca el desecho en la base de datos para luego editar la suma total en peso del desecho.
  try {
    const q = query(collection(db, "desecho"), where("uid", "==", userStore.userData.uid), where("desechoID", "==", route.params.name));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => editSum(doc.id, sum));
  } catch (e) {
    console.log(e.message);    
  }
};

const editSum = async (id, sum) => { // Edita en la base de datos la suma total en peso del desecho.
  try {
    const docRef = doc(db, "desecho", id);
    await updateDoc(docRef, {cp: sum});
  } catch (e) {
    console.log(e.message); 
  }
};

const testy = op => { // Cambia el input de la empresa en el formulario (lista o manual).
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

const refresh = () => { // Resetea los valores del formulario.
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

const generatePDF = () => { // Genera un pdf con los movimientos solicitados.
  const pdf = new jsPDF();

  autoTable(pdf, { 
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

      if(sDate.value && !eDate.value)
        pdf.text(`Desde: ${getDateInfo(sDate.value)}`, data.settings.margin.left, 20);
      else if(!sDate.value && eDate.value)
        pdf.text(`Hasta: ${getDateInfo(eDate.value)}`, data.settings.margin.left, 20);
      else if(sDate.value && eDate.value)
        pdf.text(`Desde: ${getDateInfo(sDate.value)}, Hasta: ${getDateInfo(eDate.value)}`, data.settings.margin.left, 20);
      else
        pdf.text(`Fecha: ${getDateInfo(Date.now())}`, data.settings.margin.left, 20); 

      pdf.text(`Movimientos: ${tipMov.value}`, data.settings.margin.left, 25);
      pdf.text(`Peso Total: ${Number.isInteger(sum.value) ? sum.value : parseFloat(sum.value.toFixed(4))} kg`, data.settings.margin.left, 30);

      var str = "" + pdf.getNumberOfPages();

      pdf.setFontSize(10);

      var pageSize = pdf.internal.pageSize;
      var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      pdf.text(str, 195, pageHeight - 10);
    } 
  });

  if(sDate.value && !eDate.value)
    pdf.save(`Reporte_${nombreDesecho.value.desecho}_d${getDateInfo(sDate.value)}.pdf`);
  else if(!sDate.value && eDate.value)
    pdf.save(`Reporte_${nombreDesecho.value.desecho}_h${getDateInfo(eDate.value)}.pdf`);
  else if(sDate.value && eDate.value)
    pdf.save(`Reporte_${nombreDesecho.value.desecho}_${getDateInfo(sDate.value)}_${getDateInfo(eDate.value)}.pdf`);
  else
    pdf.save(`Reporte_${nombreDesecho.value.desecho}.pdf`);
};

const showGraphic = () => { // Muestra un gráfico tomando en cuenta los movimientos solicitados.
  const ctx = <HTMLCanvasElement>document.getElementById('graphic');
  let chartStatus = Chart.getChart('graphic');
  if (chartStatus != undefined) chartStatus.destroy();

  let mA = [], mAG = [], mAR = [], uniquemA = [], uniquemAG = [], uniquemAR = [], cpmA = [];
  let cpmAG = [], cpmAR = [], all = [], green = [], red = [], finalmAG = [], finalmAR = [];
  let data = {};

  qts.forEach(i => {
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
    if(all.length > 12)
      all = all.slice(-12);
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

    if(green.length > 12) green = green.slice(-12);
    if(red.length > 12) red = red.slice(-12);
  }

  if(tipMov.value !== 'Todos'){
    uniquemA = [...new Set(mA)];
    if(uniquemA.length > 12)
      uniquemA.length = 12;

    uniquemA.reverse();
  } else {
    uniquemAG = [...new Set(mAG)];
    if(uniquemAG.length > 12)
      uniquemAG.length = 12;
    
    uniquemAG.reverse();
    for(let i = 0; i < uniquemAG.length; i++){
      finalmAG.push({x: uniquemAG[i], y: green[i]}); 
    }

    uniquemAR = [...new Set(mAR)];
    if(uniquemAR.length > 12)
      uniquemAR.length = 12;
    
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
    data: <ChartData>data,
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
  if(mes < 10) mes = parseInt('0' + mes);
  const format = `${mes}-${new Date(date).getUTCFullYear()}`;
  return format;
};

const critPoints = data => {
  let next: {cp?: number, fecha?: number}, actual: {cp: number, fecha: number};
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
  <div class="view container-sm-fluid container-lg d-flex flex-column mt-5">
    <!-- Sección superior -->
    <div class="view__top d-flex align-items-center">
      
      <RouterLink class="view__top-btn main__printer-btn" to="/">
        <i class="bi bi-arrow-left"></i>
      </RouterLink>

      <div class="d-flex ms-auto align-items-center">
        <div class="main__circle-g rounded-circle"></div>
        <div class="ms-1">Entrada</div>
        <div class="main__circle-r ms-2 ms-sm-5 rounded-circle"></div>
        <div class="ms-1">Salida</div>
      </div>

      <button class="view__top-btn main__printer-btn my-auto ms-auto" v-if="userStore.wait == 1" type="button" data-bs-toggle="modal" data-bs-target="#newItemModal" @click="refresh">
        <i class="bi bi-plus-lg"></i>
      </button>

      <p class="text-danger my-auto ms-auto" v-if="userStore.wait == 2">Renueve el Racda</p>
      <p class="text-warning my-auto ms-auto" v-if="userStore.wait == 3">Ingrese el Racda</p>
    </div>

    <p class="text-center mt-4 mb-1">{{nombreDesecho?.desecho}}</p>
    <p class="text-center mb-4">Peso Total: 
      <span v-if="!hideCP">{{Number.isInteger(sum) ? sum : parseFloat(sum.toFixed(4))}} kg</span>
      <span v-else>0 kg</span>
    </p>

    <div class="d-flex flex-column flex-sm-row justify-content-center gap-3 mb-5">

      <div class="col-sm-2 col-md-3">
        <VueMultiselect
                    v-model="tipMov"
                    :options="MOV_OPTIONS"
                    :searchable="false"
                    :allow-empty="false"
                    :show-labels="false"
                    placeholder="Todos"
                    @select="initial"
        />
      </div>

      <div class="d-flex justify-content-between align-items-center col-12 col-sm-10 col-md-9">
        <input class="modal__input modal__input-view form-control" type="date" id="startDate" v-model="sDate" @change="initial">
        <label class="form-label" for="endDate">-</label>
        <input class="modal__input modal__input-view form-control" type="date" id="endDate" v-model="eDate" @change="initial">
        <button class="main__printer-btn h-100" @click="generatePDF" type="button">
          <i class="bi bi-printer"></i>
        </button>
        <button class="main__printer-btn h-100" type="button" data-bs-toggle="modal" data-bs-target="#graphicModal" @click="showGraphic">
          <i class="bi bi-bar-chart-fill"></i>
        </button>
      </div>

    </div>
    <!-- Modal para registrar movimiento -->
    <div class="modal fade" id="newItemModal" tabindex="-1" aria-labelledby="newItemModal" aria-hidden="true">
      <div class="modal__delete modal-dialog modal-dialog-centered">
        <div class="modal__delete-content modal-content ps-3 pe-3">
          <div class="modal__delete-header modal-header">
            <h1 class="modal__delete-title modal-title" id="newItemModalLabel">Movimiento de desecho</h1>
            <button class="modal__delete-close btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal__delete-body modal-body">
            <form :class="`${validate}`" @submit.prevent="checkData" novalidate>
              <div class="mb-4">
                <label class="form-label" for="fecha">Fecha*</label>
                <input class="modal__input modal__input-des form-control" type="date" id="fecha" v-model="fecha" required>
              </div>
              <div class="mb-4">
                <label for="hora" class="form-label">Hora*</label>
                <input type="time" class="modal__input modal__input-des form-control" id="hora" v-model="hora" required>
              </div>
              <div class="mb-4">
                <label for="CP" class="form-label">Peso*</label>
                <input type="number" min="0.001" step="0.001" class="modal__input modal__input-des form-control" id="CP" oninput="validity.valid||(value='');" v-model="cp" required>
              </div>
              <div :class="`mb-5 ${su}`">
                <label class="form-label">Unidad*</label>
                <VueMultiselect
                v-model="selectedCP"
                :options="CP_OPTIONS"
                :allow-empty="false"
                :show-labels="false"
                placeholder="..."
                />
              </div>
              <div class="d-flex justify-content-between align-content-center mb-5">
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
              <div v-if="!directoryTrans" class="mb-4">
                <label for="trans" class="form-label">Empresa de Transporte</label>
                <div class="d-flex">
                  <VueMultiselect
                  v-model="empTrans"
                  :options="daTransFilt"
                  :show-labels="false"
                  placeholder="..."
                  />
                  <i class="bi bi-pencil-square ms-4" style="font-size: 25px; cursor: pointer" @click="testy('Trans')"></i>
                </div>
              </div>

              <div class="modal__emp-manual d-flex justify-content-between align-content-center mb-4">
                <div v-if="directoryTrans" class="d-flex flex-column w-100">
                  <label for="inputNameRif" class="form-label">Rif - Emp. Transporte*</label>
                  <div class="input-group">
                    <span class="input-group-text">J-</span>
                    <input type="number" class="modal__input modal__input-des form-control" min="0" max="999999999" oninput="validity.valid||(value='');" id="inputNameRif" v-model="rifTrans" required>
                    <i class="bi bi-folder ms-4" style="font-size: 25px; cursor: pointer" @click="testy('Trans')"></i>
                  </div>
                </div>
              </div>

              <div v-if="directoryTrat && !directoryTrans" class="mb-4"></div>
              <div v-if="directoryTrans" class="mb-4">
                <label for="racTrans" class="form-label">Venc. Racda*</label>
                <input type="date" class="modal__input modal__input-des form-control" id="racTrans" v-model="racdaTrans" required>
              </div>
              <div v-if="directoryTrans" class="mb-4">
                <label for="trans" class="form-label">Empresa de Transporte*</label>
                <input type="text" class="modal__input modal__input-des form-control" id="trans" v-model="empTrans" required>
              </div>
              <div v-if="!directoryTrat" class="mb-4">
                <label for="trat" class="form-label">Empresa Tratante</label>
                <div class="d-flex">
                  <VueMultiselect
                  v-model="empTrat"
                  :options="daTratFilt"
                  :show-labels="false"
                  placeholder="..."
                  />
                  <i class="bi bi-pencil-square ms-4" style="font-size: 25px; cursor: pointer" @click="testy('Trat')"></i>
                </div>
              </div>

              <div class="modal__emp-manual d-flex justify-content-between align-content-center mb-4">
                <div v-if="directoryTrat" class="d-flex flex-column w-100">
                  <label for="inputNameRif" class="form-label">Rif - Emp. Tratante*</label>
                  <div class="input-group">
                    <span class="input-group-text">J-</span>
                    <input type="number" class="modal__input modal__input-des form-control" min="0" max="999999999" oninput="validity.valid||(value='');" id="inputNameRif" v-model="rifTrat" required>
                    <i class="bi bi-folder ms-4" style="font-size: 25px; cursor: pointer" @click="testy('Trat')"></i>
                  </div>
                </div>
              </div>

              <div v-if="directoryTrat" class="mb-4">
                <label for="racTrat" class="form-label">Venc. Racda*</label>
                <input type="date" class="modal__input modal__input-des form-control" id="racTrat" v-model="racdaTrat" required>
              </div>
              <div v-if="directoryTrat" class="mb-4">
                <label for="trat" class="form-label">Empresa Tratante*</label>
                <input type="text" class="modal__input modal__input-des form-control" id="trat" v-model="empTrat" required>
              </div>
              <div class="form-group mb-4">
                <label for="exampleFormControlTextarea1">Comentario</label>
                <textarea class="modal__input form-control" id="exampleFormControlTextarea1" maxlength="100" rows="2" v-model="com"></textarea>
              </div>
              <div class="modal__delete-footer modal-footer">
                <p class="me-auto">(*) = campo requerido.</p>
                <button v-if ="!adding" type="submit" class="modal__delete-btn">Registrar</button>
                <button v-else class="modal__delete-btn d-flex align-items-center justify-content-center" type="button" disabled>
                  <span class="modal__delete-loading spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Registrando...
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal para editar movimiento -->
    <div class="modal fade" id="editItemModal" tabindex="-1" aria-labelledby="editItemModal" aria-hidden="true">
      <div class="modal__emp modal-dialog modal-dialog-centered">
        <div class="modal__emp-content modal-content ps-3 pe-3">
          <div class="modal__emp-header modal-header">
            <h1 class="modal__emp-title modal-title" id="editItemModalLabel">Modificar movimiento</h1>
            <button type="button" class="modal__emp-close btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="edit" :class="`{validate}`" novalidate>
              <div class="mb-4">
                <label for="fecha" class="form-label">Fecha*</label>
                <input type="date" class="modal__input modal__input-des form-control" id="fecha" v-model="fecha" required>
              </div>
              <div class="mb-4">
                <label for="hora" class="form-label">Hora*</label>
                <input type="time" class="modal__input modal__input-des form-control" id="hora" v-model="hora" required>
              </div>
              <div class="mb-4">
                <label for="CP" class="form-label">Peso*</label>
                <input type="number" min="0.001" step="0.001" class="modal__input modal__input-des form-control" id="CP" oninput="validity.valid||(value='');" v-model="cp" required>
              </div>
              <div :class="`mb-5 ${su}`">
                <label class="form-label">Unidad*</label>
                <VueMultiselect
                v-model="selectedCP"
                :options="CP_OPTIONS"
                :allow-empty="false"
                :show-labels="false"
                placeholder="..."
                />
              </div>
              <div class="d-flex justify-content-between align-content-center mb-5">
                <label class="form-check-label">Tipo*</label>
                <div class="form-check mt-1">
                  <input class="modal__input form-check-input" type="radio" name="entsal" id="entrada" value="Entrada" v-model="eS">
                  <label class="form-check-label" for="entrada">
                    Entrada
                  </label>
                </div>
                <div class="form-check">
                  <input class="modal__input form-check-input" type="radio" name="entsal" id="salida" value="Salida" v-model="eS">
                  <label class="form-check-label" for="salida">
                    Salida
                  </label>
                </div>
              </div>
              <div class="mb-4">
                <label for="trans" class="form-label">Empresa de Transporte</label>
                <VueMultiselect v-if="!directoryTrans"
                v-model="empTrans"
                :options="daTransFilt"
                :show-labels="false"
                placeholder="..."
                />
              </div>
              <div class="mb-4">
                <label for="trat" class="form-label">Empresa Tratante</label>
                <VueMultiselect v-if="!directoryTrat"
                v-model="empTrat"
                :options="daTratFilt"
                :show-labels="false"
                placeholder="..."
                />
              </div>
              <div class="form-group mb-4">
                <label for="exampleFormControlTextarea1">Comentario</label>
                <textarea class="modal__input form-control" id="exampleFormControlTextarea1" maxlength="100" rows="2" v-model="com"></textarea>
              </div>
              <div class="modal__delete-footer modal-footer">
                <p class="me-auto">(*) = campo requerido.</p>
                <button v-if ="!adding" type="submit" class="modal__delete-btn">Editar</button>
                <button v-else class="modal__delete-btn d-flex align-items-center justify-content-center" type="button" disabled>
                  <span class="modal__delete-loading spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Editando...
                </button>
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal" aria-hidden="true" id="disEdit" hidden></button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal para mostrar más información de un movimiento -->
    <div class="modal fade" id="infoItemModal" tabindex="-1" aria-labelledby="infoItemModal" aria-hidden="true">
      <div class="modal__emp modal-dialog modal-dialog-centered">
        <div class="modal__emp-content modal-content ps-3 pe-3">
          <div class="modal__emp-header modal-header">
            <h1 class="modal__emp-title modal-title" id="infoItemModalLabel">Información</h1>
            <button type="button" class="modal__emp-close btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="" :class="`${validate}`" novalidate>
              <div class="mb-4">
                <label for="CP" class="form-label">Peso</label>
                <input type="number" step="0.001" class="modal__input form-control" id="CP" v-model="cp" readonly required>
              </div>
              <div :class="`mb-5 ${su}`">
                <label for="unidades" class="form-label">Unidad</label>
                <input type="text" class="modal__input form-control" id="unidades" v-model="selectedCP" readonly required>
              </div>
              <div class="d-flex justify-content-between align-content-center mb-5">
                <label class="form-check-label">Tipo</label>
                <div class="form-check">
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
              <div class="mb-4">
                <label for="fecha" class="form-label">Fecha</label>
                <input type="date" class="modal__input form-control" id="fecha" v-model="fecha" readonly required>
              </div>
              <div class=""></div>
              <div class="mb-4">
                <label for="hora" class="form-label">Hora</label>
                <input type="time" class="modal__input form-control" id="hora" v-model="hora" readonly required>
              </div>
              <div class="mb-4">
                <label for="trans" class="form-label">Empresa de Transporte</label>
                <input type="text" class="modal__input form-control" id="trans" v-model="empTrans" readonly required>
              </div>
              <div class="mb-4">
                <label for="trat" class="form-label">Empresa Tratante</label>
                <input type="text" class="modal__input form-control" id="trat" v-model="empTrat" readonly required>
              </div>
              <div class="form-group mb-4">
                <label for="exampleFormControlTextarea1">Comentario</label>
                <textarea class="modal__input form-control" id="exampleFormControlTextarea1" maxlength="60" rows="2" v-model="com" readonly required></textarea>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal para mostrar la gráfica -->
    <div class="modal fade" id="graphicModal" tabindex="-1" aria-labelledby="graphicModal" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-body">
            <canvas id="graphic"></canvas>
          </div>
        </div>
      </div>
    </div>
    <!-- Toast de mensajes informativos sobre el estado de los procesos -->
    <div class="toast-container position-fixed top-0 start-50 translate-middle-x p-3">
      <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div :class="`d-flex ${msgColor}`">
          <div :class="`toast-body text-center ${msgColor == 'text-bg-danger' ? 'small' : ''}`">
            {{res}}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    </div>
    <!-- Tabla de movimientos -->
    <table class="table table-hover table-fixed">
      <thead>
        <tr>
          <th scope="col" class="text-center w-25">Fecha</th>
          <th scope="col" class="text-center w-25">Hora</th>
          <th scope="col" class="d-xxl-table-cell d-xxl-none ps w-25">Peso</th>
          <th scope="col" class="d-none d-xxl-table-cell pc w-25">Peso</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="data in showArray" :key="data.id">
          <td hidden>{{ data.id }}</td>
          <td class="text-center w-25">{{ getDateInfo(data.fecha) }}</td>
          <td class="text-center w-25">{{ data.hora }}</td>
          <td :class="data.typeCP < 0 ? 'bg-danger-subtle text-center w-25 px-0' : 'bg-success-subtle text-center w-25 px-0'" @click="() => {id = data.id}">
            {{ data.rCP }} {{ data.selectedCP }}
            <i class="bi bi-trash float-end me-1 me-sm-2 me-md-3" data-bs-toggle="modal" data-bs-target="#confirmacion" style="cursor: pointer;"></i>
            <i class="bi bi-pencil float-end me-1 me-sm-3 me-md-4" @click="getItemEdit(data.id)" data-bs-toggle="modal" data-bs-target="#editItemModal" style="cursor: pointer;"></i>
            <i class="bi bi-eye float-end me-1 me-sm-3 me-md-4" @click="getItemEdit(data.id)" data-bs-toggle="modal" data-bs-target="#infoItemModal" style="cursor: pointer"></i>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- Tabla de todos los movimientos para PDF -->
    <table id="pdftable-content" hidden>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Hora</th>
          <th>Peso</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(data, index) in showPdfArray" :key=index>
          <td class="text-center w-25">{{ getDateInfo(data.fecha) }}</td>
          <td class="text-center w-25">{{ data.hora }}</td>
          <td class="text-center w-25">{{ data.rCP }} {{data.selectedCP}}</td>
        </tr>
      </tbody>
    </table>
    <!-- Botones de atrás y siguiente -->
    <div class="d-flex justify-content-center gap-2 mt-auto mb-3">
      <button class="main__new-btn" type="button" @click="prev" :disabled="previousDisabled">Atrás</button>
      <button class="main__new-btn" type="button" @click="next" :disabled="nextDisabled">Siguiente</button>
    </div>
    <!-- Modal de confirmación para eliminar movimiento -->
    <div class="modal fade" id="confirmacion" data-bs-backdrop="static" tabindex="-1" aria-labelledby="confimacionLabel" aria-hidden="true">
      <div class="modal__delete modal-dialog modal-dialog-centered">
        <div class="modal__delete-content modal-content">
          <div class="modal__delete-header modal-header">
            <h1 class="modal__delete-title modal-title ps-3" id="confirmacionLabel">Confirmación</h1>
            <button class="modal__delete-close btn-close me-2" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal__delete-body modal-body">
            <p class="ps-3">Se eliminará el registro.</p>
            <div class="modal__delete-footer modal-footer">
              <button class="modal__delete-btn" v-if ="!adding" type="button" data-bs-dismiss="modal" aria-label="Close">Cancelar</button>
              <button class="modal__delete-btn" v-if ="!adding" type="button" @click="deleteItem(id)" data-bs-dismiss="modal" aria-label="Close">Aceptar</button>
              <button class="modal__delete-btn d-flex align-items-center justify-content-center" v-else type="button" disabled>
                <span class="modal__delete-loading spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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