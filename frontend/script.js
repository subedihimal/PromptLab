const input = document.querySelector('#input');
const chatContainer = document.querySelector('#chatContainer')
input.addEventListener('keyup', handleEnter)

const askBTN = document.querySelector("#ask");
ask.addEventListener('click', handleEnter);

const loading = document.createElement('div');
loading.className = 'my-6 max-w-fit px-4 py-3 rounded-2xl animate-pulse text-orange-300';
loading.textContent = 'Thinking...';

async function generate(text) {
    // Append message to UI
    // Send it to LLM
    //Append response to the ui

    const msg = document.createElement('div');
    msg.className = `my-6 bg-neutral-800 p-3 rounded-xl ml-auto max-w-fit`;
    msg.textContent = text;
    chatContainer?.appendChild(msg);
    input.value = ' ';

    chatContainer.appendChild(loading);
    //Call Server
    const assistantMessage = await callServer(text);

    const assistantMsgElement = document.createElement("div");
    assistantMsgElement.className = "max-w-fit";
    assistantMsgElement.textContent = assistantMessage;

    chatContainer?.removeChild(loading);
    chatContainer?.appendChild(assistantMsgElement);
}

async function callServer(inputText) {
    const response = await fetch('http://localhost:3001/chat', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: inputText }),
    });

    if (!response.ok) {
        throw new Error("Error generating the response");
    }

    const result = await response.json();
    return result.message;

}

async function handleEnter(e) {
    if (e.key == "Enter" || e.type == "click") {
        const text = input?.value.trim();
        if (!text) {
            return;
        }
        await generate(text);
    }
}