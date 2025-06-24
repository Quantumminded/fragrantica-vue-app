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
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Lista Brand</h1>
    <div class="flex flex-wrap gap-2 mb-8">
      <template v-if="brands.length">
        <router-link
          v-for="b in brands"
          :key="b.name"
          :to="{ name: 'brand', params: { name: b.name } }"
          class="px-3 py-1 bg-gray-100 rounded hover:bg-blue-100 text-blue-800 text-sm font-medium shadow"
        >
          {{ b.name }}
        </router-link>
      </template>
      <template v-else>
        <span class="text-gray-400">Nessun brand trovato</span>
      </template>
    </div>
    <h1 class="text-2xl font-bold mb-4">Lista Profumi</h1>
    <div class="grid grid-cols-2 gap-4">
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
  </div>
</template>
