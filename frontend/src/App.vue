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
      <div v-if="p.topNotes && p.topNotes.length" class="mt-2">
        <b>🌿 Top:</b>
        <div class="flex flex-wrap gap-2 mt-1">
          <div v-for="n in p.topNotes" :key="n.name" class="flex items-center gap-1 mb-1">
            <img v-if="n.image" :src="n.image" :alt="n.name" class="h-7 w-7 object-contain rounded" />
            <span>{{ n.name }}</span>
          </div>
        </div>
      </div>
      <div v-if="p.middleNotes && p.middleNotes.length" class="mt-2">
        <b>🌿 Middle:</b>
        <div class="flex flex-wrap gap-2 mt-1">
          <div v-for="n in p.middleNotes" :key="n.name" class="flex items-center gap-1 mb-1">
            <img v-if="n.image" :src="n.image" :alt="n.name" class="h-7 w-7 object-contain rounded" />
            <span>{{ n.name }}</span>
          </div>
        </div>
      </div>
      <div v-if="p.baseNotes && p.baseNotes.length" class="mt-2">
        <b>🌿 Base:</b>
        <div class="flex flex-wrap gap-2 mt-1">
          <div v-for="n in p.baseNotes" :key="n.name" class="flex items-center gap-1 mb-1">
            <img v-if="n.image" :src="n.image" :alt="n.name" class="h-7 w-7 object-contain rounded" />
            <span>{{ n.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
