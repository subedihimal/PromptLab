import OpenAI from "openai";
import { tavily } from "@tavily/core";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const MAX_ITERATIONS = 6;

export async function generate(userMessage) {
    const messages = [
        {
            role: "system",
            content: `You are a smart personal assistant who answers questions about my Portfolio. Use the webSearch tool when you need current or real-time information. Current date and time: ${new Date().toUTCString()}`,
        },
        {
            role: "user",
            content: userMessage,
        },
    ];

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        let completion;
        try {
            completion = await groq.chat.completions.create({
                model: "openai/gpt-oss-120b",
                temperature: 0,
                messages,
                tools: [
                    {
                        type: "function",
                        function: {
                            name: "webSearch",
                            description:
                                "Search the latest information and realtime data on the internet",
                            parameters: {
                                type: "object",
                                properties: {
                                    query: {
                                        type: "string",
                                        description: "The search query to perform search on.",
                                    },
                                },
                                required: ["query"],
                            },
                        },
                    },
                ],
                tool_choice: "auto",
            });
        } catch (err) {
            console.error("Model call failed:", err.message);
            return "I had trouble processing that — could you rephrase your question?";
        }

        const responseMessage = completion.choices[0].message;
        messages.push(responseMessage);

        const toolCalls = responseMessage.tool_calls;
        if (!toolCalls) {
            return responseMessage.content;
        }

        for (const tool of toolCalls) {
            const functionName = tool.function.name;
            const functionParams = tool.function.arguments;

            if (functionName === "webSearch") {
                const toolResult = await webSearch(JSON.parse(functionParams));
                messages.push({
                    tool_call_id: tool.id,
                    role: "tool",
                    name: functionName,
                    content: JSON.stringify(toolResult), // tool content must be a string
                });
            }
        }
    }

    // If we hit the iteration cap without a final answer, fail gracefully
    return "I wasn't able to finish researching that in time — try narrowing the question.";
}

async function webSearch({ query }) {
    console.log("Calling web search...");
    const response = await tvly.search(query);
    return response;
}