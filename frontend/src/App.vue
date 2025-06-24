
<script setup>
import { ref, onMounted } from 'vue'
const perfumes = ref([])
const brands = ref([])


onMounted(async () => {
  try {
    const [perfumesRes, brandsRes] = await Promise.all([
      fetch('http://localhost:3000/api/perfumes'),
      fetch('http://localhost:3000/api/brands')
    ])
    perfumes.value = await perfumesRes.json()
    brands.value = await brandsRes.json()
    console.log('BRANDS:', brands.value)
  } catch (e) {
    console.error('Errore fetch:', e)
  }
})
</script>


<template>
  <router-view />
</template>
