<template>
  <div class="p-6">
    <div v-if="loading" class="text-gray-400">Loading...</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>
    <div v-else>
      <div class="flex items-center gap-4 mb-4">
        <img v-if="brand.logo" :src="brand.logo" :alt="brand.name" class="h-20 w-20 object-contain rounded shadow" />
        <div>
          <h1 class="text-2xl font-bold">{{ brand.name }}</h1>
          <div class="text-gray-600">{{ brand.country }}</div>
          <a v-if="brand.website" :href="brand.website" target="_blank" class="text-blue-700 underline text-sm">Official Website</a>
        </div>
      </div>
      <div v-if="brand.description" class="mb-6 text-gray-800 whitespace-pre-line">{{ brand.description }}</div>
      <div v-for="(perfumes, collection) in brand.collections" :key="collection" class="mb-8">
        <h2 class="text-xl font-semibold mb-2">{{ collection }}</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="p in perfumes" :key="p.url" class="border p-3 rounded shadow bg-white">
            <img v-if="p.image" :src="p.image" :alt="p.name" class="h-24 w-full object-contain mb-2" />
            <div class="font-bold">{{ p.name }}</div>
            <div class="text-xs text-gray-500">{{ p.gender }} <span v-if="p.year">| {{ p.year }}</span></div>
            <a :href="p.url" target="_blank" class="text-blue-600 underline text-xs">View on Fragrantica</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const brand = ref({});
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch(`http://localhost:3000/api/brand/${encodeURIComponent(route.params.name)}`);
    if (!res.ok) throw new Error('Brand not found');
    brand.value = await res.json();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>
