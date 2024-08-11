import { DallEAPIWrapper } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const FAL_API_KEY = process.env.FAL_API_KEY

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

async function generateFalFluxImage(prompt: string): Promise<string> {
  try {
    const response = await $fetch<FalFluxResponse>(
      'https://fal.run/fal-ai/flux-realism',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${FAL_API_KEY}`,
        },
        body: {
          prompt: prompt,
          image_size: "landscape_4_3",
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
        },
      }
    );

    if (response.images && response.images.length > 0) {
      return response.images[0].url;
    } else {
      throw new Error('No image data received from Fal Flux API');
    }
  } catch (error) {
    console.error('Error generating Fal Flux image:', error);
    throw new Error('Failed to generate image with Fal Flux');
  }
}

interface FalFluxResponse {
  images: Array<{
    url: string;
    content_type: string;
  }>;
  prompt: string;
}

export function getImageGenerator(imageModel: string): (prompt: string) => Promise<string> {
    switch (imageModel) {
      case 'dall-e':
        const dallEWrapper = new DallEAPIWrapper({
          n: 1,
          model: "dall-e-3",
          apiKey: OPENAI_API_KEY,
        });
        return dallEWrapper.invoke.bind(dallEWrapper);
      case 'stable-diffusion':
        return generateStableDiffusionImage;
      case 'fal-flux':
        return generateFalFluxImage;
      default:
        throw new Error('Invalid image model selected');
    }
  }
  
export function getImageTool(imageModel: string) {
    const imageGenerator = getImageGenerator(imageModel);

    return tool(
        async ({ prompt }) => {
        return await imageGenerator(prompt);
        },
        {
        name: imageModel,
        description: `Generate an image using ${imageModel}`,
        schema: imageGenerationSchema,
        }
    );
}