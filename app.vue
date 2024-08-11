<script setup lang="ts">
type Mode = 'chat' | 'archGen' | 'imageComparison'

const modes: { [key in Mode]: { text: string } } = {
  chat: { text: 'Chat' },
  archGen: { text: 'ArchGen' },
  imageComparison: { text: 'Image Comparison' },
}

const currentMode = ref<Mode>('chat')
const darkMode = ref(true)

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
  document.documentElement.classList.toggle('dark')
}

const indicatorPosition = computed(() => {
  return Object.keys(modes).indexOf(currentMode.value)
})

onMounted(() => {
  document.documentElement.classList.add('dark')
})
</script>

<template>
  <div class="h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 flex flex-col">
    <div class="container mx-auto px-4 py-8 max-w-2xl h-full flex flex-col">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Raxna Chat</h1>
        <button @click="toggleDarkMode" class="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-800 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>

      <div class="mb-6">
        <div class="relative bg-gray-200 dark:bg-gray-700 rounded-full p-1 flex">
          <button
            v-for="(mode, index) in Object.keys(modes)"
            :key="mode"
            @click="currentMode = mode as Mode"
            class="flex-1 text-center py-2 text-sm font-medium transition-colors duration-200 z-10 relative"
            :class="currentMode === mode ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'"
          >
            {{ modes[mode as Mode].text }}
          </button>
          <div
            class="absolute top-1 bottom-1 rounded-full bg-white dark:bg-gray-800 transition-all duration-200 shadow-md"
            :style="{
              width: `calc(${100 / 3}% - 4px)`,
              left: `calc(${indicatorPosition * 100 / 3}% + 2px)`
            }"
          ></div>
        </div>
      </div>

      <div class="flex-grow overflow-hidden">
        <Chat v-if="currentMode === 'chat'" />
        <ArchGen v-if="currentMode === 'archGen'" />
        <ImageComparison v-if="currentMode === 'imageComparison'" />
      </div>
    </div>
  </div>
</template>