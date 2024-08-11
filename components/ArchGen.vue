<script setup lang="ts">
const prompt = ref('')
const generatedEmoji = ref('')
const isLoading = ref(false)

const generateArchitecture = async () => {
  if (!prompt.value.trim() || isLoading.value) return

  isLoading.value = true
  generatedEmoji.value = ''
  try {
    // Dummy API call
    const response = await new Promise(resolve => {
      setTimeout(() => {
        resolve({ emoji: '🏗️' }) // Random architecture-related emoji
      }, 2000)
    })
    generatedEmoji.value = response.emoji
  } catch (error) {
    console.error('Error:', error)
    generatedEmoji.value = '❌'
  } finally {
    isLoading.value = false
  }
}

const clearInput = () => {
  prompt.value = ''
  generatedEmoji.value = ''
}
</script>

<template>
  <div class="h-full flex flex-col">
    <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">ArchGen</h2>
    
    <div class="flex items-center mb-4">
      <div class="relative flex-grow mr-2">
        <input
          v-model="prompt"
          type="text"
          placeholder="What do you want to build?"
          :disabled="isLoading"
          class="w-full p-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
        />
        <button
          v-if="prompt"
          @click="clearInput"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          &#x2715;
        </button>
      </div>
      <button
        @click="generateArchitecture"
        :disabled="!prompt.trim() || isLoading"
        class="px-4 py-2 bg-teal-600 dark:bg-teal-500 text-white rounded-md hover:bg-teal-700 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isLoading ? 'Generating...' : 'Generate' }}
      </button>
    </div>

    <div v-if="isLoading || generatedEmoji" class="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
      <div v-if="isLoading" class="flex justify-center items-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
      <div v-else-if="generatedEmoji" class="text-center">
        <p class="text-6xl">{{ generatedEmoji }}</p>
      </div>
    </div>
  </div>
</template>