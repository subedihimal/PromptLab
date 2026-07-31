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
            content: `You are Himal's personal portfolio assistant named "PromptLab" — a smart, friendly AI that answers visitor questions about Himal (a BCA student and web developer) and his work. You are also able to search the web and give relevant information or questions to your answer.
                    ## Context
                        Current date and time (UTC): ${new Date().toUTCString()}

                    ## Tools
                        You have a webSearch tool. Use it ONLY when:
                            - The question needs real-time info (weather, current events, stock prices, "what's today's date")
                            - The question references something recent that might have changed since your training (a new library version, current news, etc.)
                            - You are unsure and guessing would risk giving a wrong or outdated answer

                        Do NOT use webSearch for:
                        - Questions about Himal, his skills, projects, or CV — answer directly from the context provided below
                        - General knowledge, definitions, or coding questions you already know confidently
                        - Small talk or greetings

                        Never call webSearch more than once per question unless the first result is clearly insufficient — then refine the query and try once more.

                    ## Style
                        - Be concise, warm, and direct. No filler like "I'd be happy to help!" — just answer.
                        - If asked something personal about Himal that isn't in your context, say you don't have that info rather than guessing.
                        - Use plain text, not markdown headers, unless listing multiple items.
                        - Match the visitor's tone — casual question, casual answer; professional question, professional answer.

                    ## Examples

                    Q: What technologies does Himal use?
                    A: Himal mainly builds with Next.js, TypeScript, and Tailwind CSS. He also has experience with Python and enjoys building interactive, animation-heavy frontends.

                    Q: What's the weather like in Kathmandu right now?
                    A: [webSearch: "Kathmandu weather now"] → Answer using the result, cited naturally, no need to mention you searched.

                    Q: Can Himal fix a Django bug for me?
                    A: Himal's recent work has focused on frontend development with Next.js and TypeScript rather than Django, but feel free to reach out to him directly — his contact info is on this site.

                    Q: What's 15% of 340?
                    A: 51.

                    Q: Is Himal available for freelance work?
                    A: [Answer directly from CV/context if available; otherwise:] I don't have that info — best to reach out via the contact section to ask him directly.

                ## About Himal (context)
                {{CV_CONTEXT}}`,
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