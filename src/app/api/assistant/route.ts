import OpenAI from 'openai';
import { AssistantResponse } from 'ai';
import { TextContentBlock } from 'openai/resources/beta/threads/messages.mjs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  const input: {
    threadId: string | null;
    message: string;
  } = await req.json();

  const threadId = input.threadId ?? (await openai.beta.threads.create({})).id;

  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: input.message,
  });

  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ sendMessage }) => {
      const run = await openai.beta.threads.runs.createAndPoll(threadId, {
        assistant_id:
          process.env.ASSISTANT_ID ??
          (() => {
            throw new Error('ASSISTANT_ID environment is not set');
          })(),
      });

      if (run.status === "completed") {
        const messages = await openai.beta.threads.messages.list(threadId, { run_id: run.id });
        const lastMessage =  messages.data[0];
        sendMessage({
          id: lastMessage.id,
          role: 'assistant',
          content: lastMessage.content as TextContentBlock[],
        })
      } else {
        console.log("Error");
      }
    },
  );
}