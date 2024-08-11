import { getImageTool, getImageGenerator } from "../utils/imageModel"
import { getChatModel } from "../utils/chatModel"


export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { model, message, imageModel } = body;

  const chatModel = getChatModel(model);
  const imageGenerator =  getImageGenerator(imageModel)
  const imageTool = getImageTool(imageModel)

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