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
  <div class="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <div class="p-2 bg-gray-100 dark:bg-gray-700">
      <div class="flex flex-row gap-2 text-xs">
        <div class="flex-1">
          <label class="block font-medium text-gray-700 dark:text-gray-300 mb-1">
            Chat Model
          </label>
          <div class="relative">
            <select v-model="chatModel" class="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 dark:text-white appearance-none pr-6">
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gemini-1.5-flash">Gemini 1.5</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-700 dark:text-gray-300">
              <svg class="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="flex-1">
          <label class="block font-medium text-gray-700 dark:text-gray-300 mb-1">
            Image Model
          </label>
          <div class="relative">
            <select v-model="imageModel" class="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 dark:text-white appearance-none pr-6">
              <option value="dall-e">DALL-E</option>
              <option value="stable-diffusion">Stable Diffusion</option>
              <option value="fal-flux">FLUX Realism LoRA</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-700 dark:text-gray-300">
              <svg class="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

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
</template>