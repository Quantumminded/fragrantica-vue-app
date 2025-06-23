<script setup>
import { ref, onMounted } from 'vue'
const perfumes = ref([])

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/perfumes')
  perfumes.value = await res.json()
})
</script>

<template>
  <div class="grid grid-cols-2 gap-4 p-6">
    hey
    <div v-for="p in perfumes" :key="p.title" class="border p-4 rounded shadow">
      <h2 class="text-xl font-bold">{{ p.title }}</h2>
      <p class="text-sm text-gray-600">{{ p.brand }}</p>
      <div v-if="p.image" class="my-2 flex justify-center">
        <img :src="p.image" :alt="p.title" class="max-h-60 rounded shadow" />
      </div>
      <div v-if="p.accords && p.accords.length" class="mb-2">
        <div class="font-semibold">Accordi:</div>
        <div class="mt-1 text-orange-800 text-xs">
          {{ p.accords.join(', ') }}
        </div>
      </div>
      <ul class="mt-2">
        <li v-if="p.topNotes && p.topNotes.length">🌿 <b>Top:</b> {{ p.topNotes.join(', ') }}</li>
        <li v-if="p.middleNotes && p.middleNotes.length">🌿 <b>Middle:</b> {{ p.middleNotes.join(', ') }}</li>
        <li v-if="p.baseNotes && p.baseNotes.length">🌿 <b>Base:</b> {{ p.baseNotes.join(', ') }}</li>
      </ul>
    </div>
  </div>
</template>
