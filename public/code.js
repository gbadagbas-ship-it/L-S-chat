document.addEventListener("DOMContentLoaded", function(){
    const app = document.querySelector(".app");
    const socket = io();

    let uname;
    let replyingTo = null;
    
    app.querySelector(".join-screen #join-user").addEventListener("click", function(){
        let username = app.querySelector(".join-screen #username").value;
        if(username.length == 0){
            return;
        }
        socket.emit("newuser", username);
        uname = username;
        app.querySelector(".join-screen").classList.remove("active");
        app.querySelector(".chat-screen").classList.add("active");
    });

    app.querySelector(".chat-screen #send-message").addEventListener("click", function(){
        let message = app.querySelector(".chat-screen #message-input").value;
        if(message.length == 0){
            return;
        }
        let chatData = {
            username: uname,
            text: message
        };
        if(replyingTo) {
            chatData.replyTo = replyingTo;
        }
        renderMessage("my", chatData);
        socket.emit("chat", chatData);
        app.querySelector(".chat-screen #message-input").value = "";
        clearReplyPreview();
    });

    socket.on("chat", function(message){
        renderMessage("other", message);
    });

    socket.on("update", function(update){
        renderMessage("update", update);
    });

    app.querySelector(".chat-screen #exit-chat").addEventListener("click", function(){
        socket.emit("exituser", uname);
        window.location.href = window.location.href;
    });

    function renderMessage(type, message){
        let messageContainer = app.querySelector(".chat-screen .messages");
        if(type == "my"){
            let el = document.createElement("div");
            el.setAttribute("class","message my-message");
            let replyHTML = "";
            if(message.replyTo) {
                replyHTML = `
                    <div class="reply-box">
                        <div class="reply-author"><strong>${message.replyTo.username}</strong></div>
                        <div class="reply-text">${message.replyTo.text}</div>
                    </div>
                `;
            }
            el.innerHTML = `
                <div>
                    ${replyHTML}
                    <div class="name">...You</div>
                    <div class="text">${message.text}</div>
                </div>
            `;
            messageContainer.appendChild(el);
        }else if(type == "other"){
            let el = document.createElement("div");
            el.setAttribute("class","message other-message");
            el.setAttribute("data-message", JSON.stringify(message));
            let replyHTML = "";
            if(message.replyTo) {
                replyHTML = `
                    <div class="reply-box">
                        <div class="reply-author"><strong>${message.replyTo.username}</strong></div>
                        <div class="reply-text">${message.replyTo.text}</div>
                    </div>
                `;
            }
            el.innerHTML = `
                <div>
                    ${replyHTML}
                    <div class="name">${message.username}</div>
                    <div class="text">${message.text}</div>
                </div>
            `;
            addSwipeListener(el, message);
            messageContainer.appendChild(el);
        }else if(type == "update"){
            let el = document.createElement("div");
            el.setAttribute("class","update");
            el.innerText = message;
            messageContainer.appendChild(el);
        }
        // scroll chat to end
        messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
    }

    function addSwipeListener(element, message) {
        let startX = 0;
        let isDragging = false;
        const swipeThreshold = 100;
        let swipeIndicator = null;
        
        element.addEventListener("touchstart", function(e) {
            startX = e.touches[0].clientX;
            isDragging = true;
            
            if(!swipeIndicator) {
                swipeIndicator = document.createElement("span");
                swipeIndicator.className = "swipe-indicator";
                swipeIndicator.innerHTML = "↩️";
                element.style.position = "relative";
            }
        });
        
        element.addEventListener("touchmove", function(e) {
            if(!isDragging) return;
            e.preventDefault();
            let currentX = e.touches[0].clientX;
            let diff = currentX - startX;
            
            if(diff > 0) {
                element.style.transform = `translateX(${Math.min(diff, swipeThreshold)}px)`;
                element.style.opacity = 1 - (Math.min(diff, swipeThreshold) / (swipeThreshold * 2));
                
                if(diff > swipeThreshold / 2) {
                    if(swipeIndicator && !element.contains(swipeIndicator)) {
                        element.appendChild(swipeIndicator);
                    }
                    if(swipeIndicator) {
                        swipeIndicator.style.opacity = Math.min(diff / swipeThreshold, 1);
                    }
                }
            }
        });
        
        element.addEventListener("touchend", function(e) {
            isDragging = false;
            let currentX = e.changedTouches[0].clientX;
            let diff = currentX - startX;
            
            if(diff > swipeThreshold) {
                replyingTo = message;
                showReplyPreview(message);
            }
            
            element.style.transform = "translateX(0)";
            element.style.opacity = 1;
            if(swipeIndicator && element.contains(swipeIndicator)) {
                element.removeChild(swipeIndicator);
            }
        });
    }

    function showReplyPreview(message) {
        let preview = app.querySelector(".reply-preview");
        if(!preview) {
            preview = document.createElement("div");
            preview.classList.add("reply-preview");
            app.querySelector(".chat-screen").insertBefore(preview, app.querySelector(".typebox"));
        }
        preview.innerHTML = `
            <div class="reply-preview-content">
                <div class="reply-preview-left">
                    <div class="reply-preview-author"><strong>${message.username}</strong></div>
                    <div class="reply-preview-text">${message.text}</div>
                </div>
                <button class="reply-close-btn" onclick="clearReplyPreview()">✕</button>
            </div>
        `;
        preview.style.display = "flex";
        
        // Focus sur le champ de saisie
        app.querySelector(".chat-screen #message-input").focus();
    }

    window.clearReplyPreview = function() {
        let preview = app.querySelector(".reply-preview");
        if(preview) {
            preview.style.display = "none";
        }
        replyingTo = null;
    }
});



