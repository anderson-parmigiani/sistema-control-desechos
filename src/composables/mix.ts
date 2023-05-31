import { useUserStore } from '../stores/user';
import { ref } from 'vue';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Toast } from 'bootstrap';

export const useMix = () => {
  const res = ref(''), msgColor = ref('');

  const timer = (data, time) => {
    setTimeout(() => {
      data.value = null;
    }, time);
  };

  const personalRacda = async () => {
    try {
      const userStore = useUserStore();
      const docRef = doc(db, "user", userStore.userData.uid);
      const docSnap = await getDoc(docRef);
    
      if (docSnap.exists())
        userStore.userData = {...userStore.userData, expDate: docSnap.data().expDate};
      else
        console.log("No existe el documento");
    } catch (e) {
      console.log(e.message);
    }
  };

  const racdaAlert = () => {
    const userStore = useUserStore();

    if(!userStore.userData.expDate){
      userStore.wait = 3;
    } else {
      switch (new Date(userStore.userData?.expDate).getTime() > Date.now()) {
        case true:
          userStore.wait = 1;
          break;
        case false:
          userStore.wait = 2;
          break;
        default:
          userStore.wait = 3;
          break;
      }
    }
  };

  const getDateInfo = dateInfo => {
    const date = new Date(dateInfo);

    let cDate = date.getUTCDate();
    let month = date.getUTCMonth() + 1;
    
    return cDate.toString().padStart(2, '0') + '-' + month.toString().padStart(2, '0') + '-' + date.getUTCFullYear();
  };

  const showMessage = (message, color) => { // muestra mensajes sobre el estado de los procesos.
    const toastLiveExample = document.getElementById('liveToast');
    const toast = new Toast(toastLiveExample);
    res.value = message;
    msgColor.value = color;
    toast.show();
  };

  const iconsFunc = (type, conf, deleteItem: Function, getItemEdit: Function, event) => {
    // const allTr = type !== 'mov' ? document.querySelectorAll(`#${type} tr`) : document.querySelectorAll('tbody tr');
    // allTr.forEach(i => {
      // if((event.target as Element).className === ('bi bi-trash float-end' || 'bi bi-trash float-end me-3')){
      //   const id = (event.target as Element).parentElement.parentElement.firstElementChild.innerHTML;
      //   console.log(id)
      //   const waitConf = () => {
      //     console.log(conf.value)
      //     if(!conf.value){
      //       setTimeout(waitConf, 500);
      //     } else if(conf.value){
      //       (event.target as Element).parentElement.parentElement.remove();
      //       deleteItem(id, type);
      //     }
      //   };
      //   waitConf();

      // } 
      if((event.target as Element).classList.contains('bi-pencil') || (event.target as Element).classList.contains('bi-eye')){
        const id = (event.target as Element).parentElement.parentElement.firstElementChild.innerHTML;
        type !== 'mov' ? getItemEdit(id, type) : getItemEdit(id);
      } 

      if(type === 'mov'){
        const color = event.lastElementChild;
        if(parseFloat(color.textContent) < 0) color.classList.add("bg-danger-subtle");
        else color.classList.add("bg-success-subtle");
        // if(new Date(color.textContent).getTime() < Date.now())
        //   color.nextElementSibling.classList.add("bg-danger-subtle");
        // else
        //   color.nextElementSibling.classList.add("bg-success-subtle");
      } 
      // else {
      //   if(parseFloat(color.textContent) < 0) color.classList.add("bg-danger-subtle");
      //   else color.classList.add("bg-success-subtle");
      // }
    // });







    // let allTr;
    // console.log(type);
    // if(type === 'empTrat')
    //   allTr = document.querySelectorAll('#empTrat tr');
    // else if(type === 'empTrans')
    //   allTr = document.querySelectorAll('#empTrans tr');
    // else{
    //   document.querySelectorAll('tbody tr');
    // }
    // const allTr = type !== 'mov' ? document.querySelectorAll(`#${type} tr`) : document.querySelectorAll('tbody tr');
    // console.log(allTr);
  //   allTr.forEach(i => {
  //     i.addEventListener("click", e => {
  //       console.log(e.target);
  //       if((e.target as Element).className === ('bi bi-trash float-end' || 'bi bi-trash float-end me-3')){
  //         const id = (e.target as Element).parentElement.parentElement.firstElementChild.innerHTML;
  
  //         const waitConf = () => {
  //           if(!conf.value){
  //             setTimeout(waitConf, 500);
  //           } else if(conf.value){
  //             (e.target as Element).parentElement.parentElement.remove();
  //             type !== 'mov' ? deleteItem(id, type) : deleteItem(id);
  //           }
  //         };
  //         waitConf();

  //       } else if((e.target as Element).classList.contains('bi-pencil') || (e.target as Element).classList.contains('bi-eye')){
  //         const id = (e.target as Element).parentElement.parentElement.firstElementChild.innerHTML;
  //         type !== 'mov' ? getItemEdit(id, type) : getItemEdit(id);
  //       } 
  //     });

  //     const color = type !== 'mov' ? i.lastElementChild.previousElementSibling : i.lastElementChild;

  //     if(type !== 'mov'){
  //       if(new Date(color.textContent).getTime() < Date.now())
  //         color.nextElementSibling.classList.add("bg-danger-subtle");
  //       else
  //         color.nextElementSibling.classList.add("bg-success-subtle");
  //     } else {
  //       if(parseFloat(color.textContent) < 0) color.classList.add("bg-danger-subtle");
  //       else color.classList.add("bg-success-subtle");
  //     }
  //   });
  };

  return {
    timer,
    personalRacda,
    racdaAlert,
    getDateInfo,
    iconsFunc,
    showMessage,
    res,
    msgColor,
  }
};