import { useUserStore } from '../stores/user';
import { ref } from 'vue';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const useMix = () => {
  const res = ref();

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

    if(cDate < 10) cDate = parseInt('0' + cDate);
    if(month < 10) month = parseInt('0' + month);
    
    return cDate + '-' + month + '-' + date.getUTCFullYear();
  };

  const iconsFunc = (type, conf, deleteItem: Function, getItemEdit: Function) => {
    const allTr = type !== 'mov' ? document.querySelectorAll(`#${type} tr`) : document.querySelectorAll('tbody tr');
  
    allTr.forEach(i => {
      i.addEventListener("click", e => {
        if((e.target as Element).className === ('bi bi-trash float-end' || 'bi bi-trash float-end me-3')){
          const id = (e.target as Element).parentElement.parentElement.firstElementChild.innerHTML;
  
          const waitConf = () => {
            if(!conf.value){
              setTimeout(waitConf, 500);
            } else if(conf.value){
              (e.target as Element).parentElement.parentElement.remove();
              type !== 'mov' ? deleteItem(id, type) : deleteItem(id);
            }
          };
          waitConf();

        } else if((e.target as Element).classList.contains('bi-pencil') || (e.target as Element).classList.contains('bi-eye')){
          const id = (e.target as Element).parentElement.parentElement.firstElementChild.innerHTML;
          type !== 'mov' ? getItemEdit(id, type) : getItemEdit(id);
        } 
      });

      const color = type !== 'mov' ? i.lastElementChild.previousElementSibling : i.lastElementChild;

      if(type !== 'mov'){
        if(new Date(color.textContent).getTime() < Date.now())
          color.nextElementSibling.classList.add("bg-danger-subtle");
        else
          color.nextElementSibling.classList.add("bg-success-subtle");
      } else {
        if(parseFloat(color.textContent) < 0) color.classList.add("bg-danger-subtle");
        else color.classList.add("bg-success-subtle");
      }
    });
  };

  return {
    res,
    timer,
    personalRacda,
    racdaAlert,
    getDateInfo,
    iconsFunc
  }
};