const input = document.querySelector('#input');

input.addEventListener('keyup', handleEnter)
function handleEnter(e){
    if (e.key == "Enter"){
        const text = input?.value.trim();
        if(!text){
            return;
        }

        console.log(text);
    }
}