<script setup lang="ts">
type ChatModel = 'claude-3-sonnet' | 'gpt-4o-mini' |'gemini-1.5-flash'
type ImageModel = 'dall-e' | 'stable-diffusion' | 'fal-flux'

type ChatHistoryItem = {
  role: string;
  content: string;
  loading?: boolean;
  isImage?: boolean;
}

const chatModel = ref<ChatModel>('claude-3-sonnet')
const imageModel = ref<ImageModel>('fal-flux')
const userInput = ref('')
const chatHistory = reactive<ChatHistoryItem[]>([])
const darkMode = ref(true)
const isLoading = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const chatContainerRef = ref<HTMLDivElement | null>(null)

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  isLoading.value = true
  const message = userInput.value 
  userInput.value = ''
  await nextTick() 
  resizeTextarea()

  chatHistory.push({ role: 'user', content: message })
  chatHistory.push({ role: 'assistant', content: 'Typing...', loading: true })

  try {
    const response: { message: string; image?: string } = await $fetch('/api/chat', {
      method: 'POST',
      body: {
        model: chatModel.value,
        message: message,
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
  } finally {
    isLoading.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
  document.documentElement.classList.toggle('dark')
}
const resizeTextarea = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 150)}px`
  }
}

const scrollToBottom = () => {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

onMounted(() => {
  document.documentElement.classList.add('dark')
})

watch(userInput, resizeTextarea)
watch(chatHistory, scrollToBottom, { deep: true })

const isInputEmpty = computed(() => !userInput.value.trim())

const formatMessage = (message: string) => {
  return message.replace(/\n/g, '<br>')
}
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

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Chat Model:
            <select v-model="chatModel" class="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gemini-1.5-flash">Gemini 1.5</option>
            </select>
          </label>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Image Model:
            <select v-model="imageModel" class="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="dall-e">DALL-E</option>
              <option value="stable-diffusion">Stable Diffusion</option>
              <option value="fal-flux">FLUX Realism LoRA</option>
            </select>
          </label>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md flex-grow flex flex-col overflow-hidden">
        <div ref="chatContainerRef" class="flex-grow overflow-y-auto p-4">
          <div v-for="(message, index) in chatHistory" :key="index" class="mb-4 flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
            <div :class="[
              'rounded-lg p-3',
              message.role === 'user' ? 'bg-teal-100 dark:bg-teal-900' : 'bg-gray-100 dark:bg-gray-700',
              message.loading ? 'animate-pulse' : '',
              message.isImage ? 'max-w-[70%]' : 'max-w-[70%] inline-block'
            ]">
              <p v-if="!message.isImage" :class="[
                'text-sm',
                message.role === 'user' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-800 dark:text-gray-200'
              ]" v-html="formatMessage(message.content)"></p>
              <img v-else :src="message.content" alt="Generated Image" class="max-w-full h-auto rounded-lg" />
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div class="flex items-end">
            <textarea
              ref="textareaRef"
              v-model="userInput"
              @keydown="handleKeydown"
              @input="resizeTextarea"
              placeholder="Type your message... (Shift+Enter for new line)"
              :disabled="isLoading"
              class="flex-grow mr-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm resize-none min-h-[40px] max-h-[150px]"
              rows="1"
            ></textarea>
            <button
              @click="sendMessage"
              :disabled="isInputEmpty || isLoading"
              class="px-4 py-2 bg-teal-600 dark:bg-teal-500 text-white rounded-md hover:bg-teal-700 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed h-[40px]"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>