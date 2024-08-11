import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export function getChatModel(model: string): BaseChatModel {
  switch (model) {
    case 'claude-3-sonnet':
      return new ChatAnthropic({
        modelName: 'claude-3-sonnet-20240229',
        anthropicApiKey: ANTHROPIC_API_KEY,
        temperature: 0
      });
    case 'gpt-4o-mini':
      return new ChatOpenAI({ modelName: 'gpt-4o-mini', openAIApiKey: OPENAI_API_KEY, temperature: 0 });
    case 'gemini-1.5-flash':
      return new ChatGoogleGenerativeAI({ 
        model: model,
        temperature: 0,
        maxRetries: 2,
        apiKey: GOOGLE_API_KEY
      });
    default:
      throw new Error('Invalid chat model selected');
  }
}