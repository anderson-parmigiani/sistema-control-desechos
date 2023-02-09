import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useMix } from '../composables/mix';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import router from '../router';

export const useUserStore = defineStore('userStore', () => {
  const userData = ref(null);
  // const loading = ref(false);
  const loadingUser = ref(false);
  const wait = ref(null);
  const defaultPhoto = 'https://firebasestorage.googleapis.com/v0/b/sistema-control-desechos.appspot.com/o/images%2Fusers%2Fblue.png?alt=media&token=56acc29d-ff0a-4bc7-83cc-a6dde3556cf3';

  const { personalRacda, racdaAlert } = useMix();

  const createUser = async (name, email, pass) => {
    loadingUser.value = true;

    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(auth.currentUser, {displayName: name, photoURL: defaultPhoto});
      await sendEmailVerification(auth.currentUser);
      await signOut(auth);
      return 'Se ha enviado un correo de verificación.';
      
    } catch (error) {
        console.log(error.code, error.message);
        return 'Hubo un problema.';

    } finally {
      loadingUser.value = false;
    };
  };

  const login = async (email, pass) => {
    loadingUser.value = true;

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, pass);

      if(auth.currentUser.emailVerified){
        userData.value = {name: user.displayName, email: user.email, photo: user.photoURL, uid: user.uid};
        router.push("/");

      } else {
        await signOut(auth);
        return 'Debes verificar tu correo.';
      }

    } catch (error) {
      console.log(error.code, error.message);
      return error.code == 'auth/wrong-password' || 'auth/user-not-found' ? 'Datos incorrectos.' : error.code;

    } finally {
      setTimeout(() => {
        loadingUser.value = false;        
      }, 4000);
    };
  };
  
  const logout = async () => {
    try {
      await signOut(auth);
      userData.value = null;
      router.push("/autenticacion"); 

    } catch (error) {
      console.log(error.code, error.message);
    };
  };

  const currentUser = async () => {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, user => {
        if (user) {
          userData.value = {name: user.displayName, email: user.email, photo: user.photoURL, uid: user.uid};

        } else {
          userData.value = null;
        }

        resolve(user);
      }, e => reject(e));

      unsubscribe();
    });
  }

  const changePass = async email => {
    loadingUser.value = true;

    try {
      await sendPasswordResetEmail(auth, email);
      return 'Se ha enviado un correo.';
    } 

    catch (error) {

      if(error.code == 'auth/user-not-found' || 'auth/invalid-email') {
        return 'Usuario no encontrado / Email Inválido.';
      }

      else if(error.code == 'auth/too-many-requests') {
        return 'Ha hecho muchas solicitudes.';
      }

      else {
        return error.code;
      }

    } finally {
      loadingUser.value = false;
    };
  };

  const updateName = async name => {

    try {
      await updateProfile(auth.currentUser, { displayName: name});
      userData.value = {...userData.value, name};
      return 'Informacion actualizada.';

    } catch (error) {
      console.log(error.code, error.message);
      return 'Hubo un problema.';
    }
  };

  const updatePhoto = async url => {

    try {
      await updateProfile(auth.currentUser, { photoURL: url});
      userData.value = {...userData.value, photo: url};

    } catch (error) {
      console.log(error.code, error.message);
    };
  };

  const emailVerified = async () => auth.currentUser.emailVerified;

  return {
    auth,
    router,
    userData,
    wait,
    // loading,
    loadingUser,
    createUser,
    login,
    logout,
    currentUser,
    changePass,
    updateName,
    updatePhoto,
    emailVerified,
    personalRacda,
    racdaAlert
  };
});