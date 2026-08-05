function applyTheme(){
    const saved = localStorage.getItem("theme");
    if(saved === "light"){
        document.body.classList.add("light");
    }else{
        document.body.classList.remove("light");
    }
}

function toggleTheme(){
    const light = document.body.classList.toggle("light");
    localStorage.setItem("theme", light ? "light" : "dark");
}

applyTheme();


function useSuggestion(text){
    const input = document.getElementById("question");
    if(!input) return;
    input.value = text;
    input.focus();
    input.dispatchEvent(new Event("input"));
}


function addMessage(type, text){
    const container = document.getElementById("chatMessages");
    const empty = document.getElementById("emptyState");

    if(empty){
        empty.remove();
    }

    const div = document.createElement("div");
    div.className = "message " + type;

    const label = document.createElement("span");
    label.className = "message-label";
    label.textContent = type === "user" ? "YOU" : "AI ASSISTANT";

    const content = document.createElement("div");
    content.textContent = text;

    div.appendChild(label);
    div.appendChild(content);
    container.appendChild(div);

    container.scrollTop = container.scrollHeight;

    return content;
}


const chatForm = document.getElementById("chatForm");

if(chatForm){

    const input = document.getElementById("question");
    const sendBtn = document.getElementById("sendBtn");
    const sendText = document.getElementById("sendText");
    const sendSpinner = document.getElementById("sendSpinner");

    input.addEventListener("input", function(){
        this.style.height = "auto";
        this.style.height = Math.min(this.scrollHeight, 150) + "px";
    });

    input.addEventListener("keydown", function(e){
        if(e.key === "Enter" && !e.shiftKey){
            e.preventDefault();
            chatForm.requestSubmit();
        }
    });

    chatForm.addEventListener("submit", async function(e){
        e.preventDefault();

        const question = input.value.trim();

        if(!question) return;

        addMessage("user", question);

        input.value = "";
        input.style.height = "auto";

        sendBtn.disabled = true;
        sendText.classList.add("hidden");
        sendSpinner.classList.remove("hidden");

        const aiContent = addMessage("ai", "Thinking...");

        try{
            const response = await fetch("/stream", {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    question:question
                })
            });

            if(!response.ok){
                throw new Error("Server error: " + response.status);
            }

            aiContent.textContent = "";

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = "";

            while(true){
                const {value, done} = await reader.read();

                if(done) break;

                buffer += decoder.decode(value, {stream:true});

                const lines = buffer.split("\n");
                buffer = lines.pop();

                for(const line of lines){
                    if(!line.trim()) continue;

                    const data = JSON.parse(line);

                    if(data.type === "chunk"){
                        aiContent.textContent += data.content;
                        document.getElementById("chatMessages").scrollTop =
                            document.getElementById("chatMessages").scrollHeight;
                    }

                    if(data.type === "error"){
                        aiContent.textContent = "❌ " + data.content;
                    }
                }
            }

        }catch(error){
            aiContent.textContent = "❌ Error: " + error.message;
        }

        sendBtn.disabled = false;
        sendText.classList.remove("hidden");
        sendSpinner.classList.add("hidden");
    });
}


function filterHistory(){
    const search = document.getElementById("historySearch");
    const cards = document.querySelectorAll(".history-card");

    if(!search) return;

    const value = search.value.toLowerCase();

    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(value) ? "" : "none";
    });
}
