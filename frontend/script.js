const input = document.querySelector('#input');
const chatContainer = document.querySelector('#chatContainer')
input.addEventListener('keyup', handleEnter)

const askBTN = document.querySelector("#ask");
ask.addEventListener('click', handleEnter);

function generate(text){
    // Append message to UI
    // Send it to LLM
    //Append response to the ui

    const msg = document.createElement('div');
    msg.className =`my-6 bg-neutral-800 p-3 rounded-xl ml-auto max-w-fit`;
    msg.textContent = text;
    chatContainer?.appendChild(msg);
    input.value= ' ';
}

function handleEnter(e){
    if (e.key == "Enter" || e.type=="click"){
        const text = input?.value.trim();
        if(!text){
            return;
        }
        generate(text);
    }
}