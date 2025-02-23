const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const readline = require('readline');
const fs = require('fs');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Uploads the given file to Gemini.
 *
 * See https://ai.google.dev/gemini-api/docs/prompting_with_media
 */
async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  const file = uploadResult.file;
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-thinking-exp-01-21",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536,
  responseMimeType: "text/plain",
};

async function run() {
  rl.question('Enter the path to the prompt text file: ', async (promptFilePath) => {
    const prompt = fs.readFileSync(promptFilePath, 'utf8');

    const imagePaths = [];
    function askForImagePath() {
      rl.question('Enter the path to an image file (or press Enter to finish): ', async (imagePath) => {
        if (imagePath) {
          imagePaths.push(imagePath);
          askForImagePath();
        } else {
          const files = [];
          for (const imagePath of imagePaths) {
            const file = await uploadToGemini(imagePath, "image/jpeg");
            files.push(file);
          }

          const history = [
            {
              role: "user",
              parts: [
                {
                  fileData: {
                    mimeType: files[0].mimeType,
                    fileUri: files[0].uri,
                  },
                },
                { text: prompt },
              ],
            },
          ];

          const chatSession = model.startChat({
            generationConfig,
            history,
          });

          const result = await chatSession.sendMessage("Generate response based on the provided prompt and images.");
          console.log(result.response.text());

          rl.close();
        }
      });
    }

    askForImagePath();
  });
}

run();