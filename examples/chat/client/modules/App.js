'use strict';

import SocketClient from './SocketClient';

class App {
    constructor() {  
        this.teamID = 0;
        this.status = [[],[]];
        this.callback = undefined;

        this._socket = new SocketClient();

        this._socket.addEvents(['ROOM_RESPONSE', 'USER_ENROLLED', 'END_OF_GAME','COUNTDOWN', 'PUBLIC_MESSAGE']);

        this._socket.addListener('CONNECTED', this.onConnect, this);
        this._socket.addListener('ROOM_RESPONSE', this.onRoomResponse, this);
        this._socket.addListener('PUBLIC_MESSAGE', this.onPublicMessage, this);

        this._socket.connect('ws:/localhost:1234');
    }

    setOnMessageCallback(callback) {
        this._onMesssageCallback = callback;
    }

    enterRoom(nick) {
        this._socket.send('ROOM_REQUEST', {userName: nick});
    }

    sendPublicMessage(message) {
        this._socket.send('PUBLIC_MESSAGE', {message: message})
    }

    onConnect() {
        console.log('connected!!!!');
    }

    onRoomResponse(data) {
        console.log("ROOM:", data.payload.roomID);
    }

    onPublicMessage(data) {
        let user = data.payload.user;
        let message = data.payload.message
        this._onMesssageCallback && this._onMesssageCallback(user, message);
    }
}

export let app = new App();