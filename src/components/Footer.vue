<script setup lang="ts">
import {ref} from 'vue';

const currentYear = ref(new Date().getFullYear())
</script>

<template>
  <footer class="footer text-center mt-auto py-3">
      <p class="footer__text m-0">© Parandev {{currentYear}}. Todos los derechos reservados.</p>
  </footer>
</template>