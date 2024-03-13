import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import 'bootstrap-icons/font/bootstrap-icons.css';
import './css/base/custom-styles.css';
import './css/ui/empresas.css';
import './css/ui/desechoView.css';
import './css/ui/inicio.css';

const app = createApp(App);

app.use(createPinia()).use(router).mount('#app'); 