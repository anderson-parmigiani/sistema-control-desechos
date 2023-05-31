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

  return {
    timer,
    personalRacda,
    racdaAlert,
    getDateInfo,
    showMessage,
    res,
    msgColor,
  }
};