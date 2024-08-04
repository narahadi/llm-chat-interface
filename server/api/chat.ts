// server/api/chat.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { DallEAPIWrapper } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

async function generateStableDiffusionImage(prompt: string): Promise<string> {
    try {
      const response = await $fetch<GenerationResponse>(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${STABILITY_API_KEY}`,
          },
          body: {
            text_prompts: [{ text: prompt }],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            steps: 30,
            samples: 1,
          },
        }
      );
  
      if (response.artifacts && response.artifacts.length > 0) {
        return `data:image/png;base64,${response.artifacts[0].base64}`;
      } else {
        throw new Error('No image data received from Stable Diffusion API');
      }
    } catch (error) {
      console.error('Error generating Stable Diffusion image:', error);
      throw new Error('Failed to generate image with Stable Diffusion');
    }
  }
  
  interface GenerationResponse {
    artifacts: Array<{
      base64: string;
      seed: number;
      finishReason: string;
    }>;
  }

const imageGenerationSchema = z.object({
  prompt: z.string().describe("The text prompt to generate an image from."),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { model, message, imageModel } = body;

  let chatModel;
  switch (model) {
    case 'claude-3-sonnet':
      chatModel = new ChatAnthropic({
        modelName: 'claude-3-sonnet-20240229',
        anthropicApiKey: ANTHROPIC_API_KEY,
        temperature: 0
      });
      break;
    case 'gpt-4o-mini':
      chatModel = new ChatOpenAI({ modelName: 'gpt-4o-mini', openAIApiKey: OPENAI_API_KEY, temperature: 0 });
      break;
    case 'gemini-1.5-flash':
      chatModel = new ChatGoogleGenerativeAI({ 
        model: model,
        temperature: 0,
        maxRetries: 2,
        apiKey: GOOGLE_API_KEY
      });
      break;
    default:
      throw new Error('Invalid chat model selected');
  }

  let imageTool;
  let imageGenerator;
  switch (imageModel) {
    case 'dall-e':
      const dallEWrapper = new DallEAPIWrapper({
        n: 1,
        model: "dall-e-3",
        apiKey: OPENAI_API_KEY,
      });
      imageTool = tool(
        async ({ prompt }) => {
          const imageURL = await dallEWrapper.invoke(prompt);
          return imageURL;
        },
        {
          name: "dall-e",
          description: "Generate an image using DALL-E 3",
          schema: imageGenerationSchema,
        }
      );
      imageGenerator = dallEWrapper.invoke.bind(dallEWrapper);
      break;
    case 'stable-diffusion':
        imageTool = tool(
            async ({ prompt }) => {
                return await generateStableDiffusionImage(prompt);
            },
            {
                name: "stable-diffusion",
                description: "Generate an image using Stable Diffusion XL 1.0",
                schema: imageGenerationSchema,
            }
            );
            imageGenerator = generateStableDiffusionImage;
            break;
    default:
      throw new Error('Invalid image model selected');
  }

  const llmWithTools = chatModel.bindTools([imageTool]);

  try {
    const result = await llmWithTools.invoke(message);
    let content = '';
    let imagePrompt = null;
  
    if (result && typeof result === 'object' && 'content' in result) {
      if (typeof result.content === 'string') {
        content = result.content;
      } else if (Array.isArray(result.content)) {
        content = result.content
          .filter(item => 'type' in item && item.type === 'text')
          .map(item => {
            if ('text' in item) {
              return item.text;
            }
            return '';
          })
          .join('\n');
      }
      if ('tool_calls' in result && Array.isArray(result.tool_calls) && result.tool_calls.length > 0) {
        imagePrompt = result.tool_calls[0].args.prompt;
      }
    } else {
      console.error('Unexpected result format:', result);
      content = 'The AI generated a response, but it was in an unexpected format.';
    }

    let generatedImage = null;
    if (imagePrompt) {
      try {
        generatedImage = await imageGenerator(imagePrompt);
      } catch (error) {
        console.error('Error generating image:', error);
        content += '\n\nUnfortunately, there was an error generating the image.';
      }
    }
    return {
      message: content,
      image: generatedImage,
    };
  } catch (error) {
    console.error('Error in chat processing:', error);
    return {
      message: 'An error occurred while processing your request. Please try again.',
      image: null,
    };
  }
});