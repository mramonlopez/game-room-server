'use strict'

let app = require('./modules/App').app;

global.loaded = () => {
    let login = document.getElementById("login");
    let chat = document.getElementById("chat");

    let nick = document.getElementById("nick");
    let connectButton = document.getElementById("connect");

    // Connnect
    connectButton.onclick = () => {
        app.enterRoom(nick.value);
        login.style.display = "none";
        chat.style.display = "block"; 
    }

    // Send message
    let message = document.getElementById("message");
    let sendButton = document.getElementById("send");
    let chatContent = document.getElementById("chat-content");

    sendButton.onclick = () => {
        app.sendPublicMessage(message.value);
        chatContent.innerHTML += "<p style=\"text-align: right\">" + message.value + "</p>";
        message.value = "";
    }

    app.setOnMessageCallback((user, message) => {
        chatContent.innerHTML += "<p style=\"text-align: left\">" + user + ":" + message + "</p>";
    })
}




