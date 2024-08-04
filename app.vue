<script setup lang="ts">
type ChatModel = 'claude-3-sonnet' | 'gpt-4o-mini' |'gemini-1.5-flash'
type ImageModel = 'dall-e' | 'stable-diffusion'

const chatModel = ref<ChatModel>('claude-3-sonnet')
const imageModel = ref<ImageModel>('dall-e')
const userInput = ref('')
const chatHistory = reactive<{ role: string; content: string; loading?: boolean }[]>([])
const generatedImage = ref('')
const darkMode = ref(true)

const isImageUrl = computed(() => {
  return generatedImage.value.startsWith('http') || generatedImage.value.startsWith('data:image')
})

const sendMessage = async () => {
  if (!userInput.value.trim()) return

  chatHistory.push({ role: 'user', content: userInput.value })
  chatHistory.push({ role: 'assistant', content: 'Typing...', loading: true })

  try {
    const response = await $fetch('/api/chat', {
      method: 'POST',
      body: {
        model: chatModel.value,
        message: userInput.value,
        imageModel: imageModel.value
      }
    })

    chatHistory.pop() // Remove loading message
    chatHistory.push({ role: 'assistant', content: response.message })
    
    if (response.image) {
      chatHistory.push({ role: 'assistant', content: 'Generating image, please wait...', loading: true })
      // Simulate a delay to show the loading message
      await new Promise(resolve => setTimeout(resolve, 1000))
      chatHistory.pop() // Remove loading message
      chatHistory.push({ role: 'assistant', content: response.image, isImage: true })
    }
  } catch (error) {
    console.error('Error:', error)
    chatHistory.pop() // Remove loading message
    chatHistory.push({ role: 'assistant', content: 'Sorry, an error occurred.' })
  }
  userInput.value = ''
}

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
  document.documentElement.classList.toggle('dark')
}
</script>


<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Raxna Chat</h1>
        <button @click="toggleDarkMode" class="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-800 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Chat Model:
            <select v-model="chatModel" class="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gemini-1.5-flash">Gemini 1.5</option>
            </select>
          </label>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Image Model:
            <select v-model="imageModel" class="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="dall-e">DALL-E</option>
              <option value="stable-diffusion">Stable Diffusion</option>
            </select>
          </label>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 h-[calc(100vh-300px)] overflow-y-auto">
        <div v-for="(message, index) in chatHistory" :key="index" class="mb-4 flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
          <div :class="[
            'rounded-lg p-3',
            message.role === 'user' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700',
            message.loading ? 'animate-pulse' : '',
            message.isImage ? 'max-w-[70%]' : 'max-w-[70%] inline-block'
          ]">
            <p v-if="!message.isImage" :class="[
              'text-sm',
              message.role === 'user' ? 'text-blue-800 dark:text-blue-200' : 'text-gray-800 dark:text-gray-200'
            ]">
              {{ message.content }}
            </p>
            <img v-else :src="message.content" alt="Generated Image" class="max-w-full h-auto rounded-lg" />
          </div>
        </div>
      </div>

      <div class="flex">
        <input v-model="userInput" @keyup.enter="sendMessage" placeholder="Type your message..." class="flex-grow mr-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
        <button @click="sendMessage" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-sm">Send</button>
      </div>
    </div>
  </div>
</template>