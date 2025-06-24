<template>
  <div class="p-6">
    <div v-if="loading" class="text-gray-400">Loading...</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>
    <div v-else>
      <div class="flex items-center gap-4 mb-4">
        <img v-if="perfume.image" :src="perfume.image" :alt="perfume.title" class="h-32 w-32 object-contain rounded shadow" />
        <div>
          <h1 class="text-2xl font-bold">{{ perfume.title }}</h1>
          <div class="text-gray-600">{{ perfume.brand }}</div>
        </div>
      </div>
      <div v-if="perfume.description" class="mb-6 text-gray-800 whitespace-pre-line">{{ perfume.description }}</div>
      <div v-if="perfume.accords && perfume.accords.length" class="mb-4">
        <div class="font-semibold">Accords:</div>
        <div class="mt-1 text-orange-800 text-xs">{{ perfume.accords.join(', ') }}</div>
      </div>
      <div v-if="perfume.topNotes && perfume.topNotes.length" class="mb-4">
        <b>🌿 Top Notes:</b>
        <div class="flex flex-wrap gap-2 mt-1">
          <div v-for="n in perfume.topNotes" :key="n.name" class="flex items-center gap-1 mb-1">
            <img v-if="n.image" :src="n.image" :alt="n.name" class="h-7 w-7 object-contain rounded" />
            <span>{{ n.name }}</span>
          </div>
        </div>
      </div>
      <div v-if="perfume.middleNotes && perfume.middleNotes.length" class="mb-4">
        <b>🌿 Middle Notes:</b>
        <div class="flex flex-wrap gap-2 mt-1">
          <div v-for="n in perfume.middleNotes" :key="n.name" class="flex items-center gap-1 mb-1">
            <img v-if="n.image" :src="n.image" :alt="n.name" class="h-7 w-7 object-contain rounded" />
            <span>{{ n.name }}</span>
          </div>
        </div>
      </div>
      <div v-if="perfume.baseNotes && perfume.baseNotes.length" class="mb-4">
        <b>🌿 Base Notes:</b>
        <div class="flex flex-wrap gap-2 mt-1">
          <div v-for="n in perfume.baseNotes" :key="n.name" class="flex items-center gap-1 mb-1">
            <img v-if="n.image" :src="n.image" :alt="n.name" class="h-7 w-7 object-contain rounded" />
            <span>{{ n.name }}</span>
          </div>
        </div>
      </div>
      <div v-if="perfume.notes && perfume.notes.length" class="mb-4">
        <b>🌿 Notes:</b>
        <div class="flex flex-wrap gap-2 mt-1">
          <div v-for="n in perfume.notes" :key="n.name" class="flex items-center gap-1 mb-1">
            <img v-if="n.image" :src="n.image" :alt="n.name" class="h-7 w-7 object-contain rounded" />
            <span>{{ n.name }}</span>
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
const perfume = ref({});
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const url = decodeURIComponent(route.query.url);
    const res = await fetch(`http://localhost:3000/api/perfume?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error('Perfume not found');
    perfume.value = await res.json();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>
