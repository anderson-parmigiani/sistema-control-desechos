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
    const userStore = useUserStore();

    try {
      const docRef = doc(db, "user", userStore.userData.uid);
      const docSnap = await getDoc(docRef);
    
      if (docSnap.exists()) {
        userStore.userData = {...userStore.userData, expDate: docSnap.data().expDate};
      } else {
        console.log("No existe el documento");
      }
    } catch (error) {
      console.log(error.code, error.message);
    }
  };

  const racdaAlert = () => {
    const userStore = useUserStore();

    if(userStore.userData.expDate == null){
      userStore.wait = 3;
    }
    else {
      switch (new Date(userStore.userData?.expDate) > Date.now()) {
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
    if(cDate < 10){
      cDate = '0' + cDate;
    }
    if(month < 10){
      month = '0' + month;
    }
    return cDate + '-' + month + '-' + date.getUTCFullYear();
  };

  return {
    res,
    timer,
    personalRacda,
    racdaAlert,
    getDateInfo
  }
};