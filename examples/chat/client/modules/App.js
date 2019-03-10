'use strict';

import SocketClient from './SocketClient';

class App {
    constructor() {  
        this.teamID = 0;
        this.status = [[],[]];
        this.callback = undefined;

        this._socket = new SocketClient();

        this._socket.addEvents(['ROOM_RESPONSE', 'USER_ENROLLED', 'GAME_STARTS', 'END_OF_GAME','COUNT_DOWN', 'GAME_STATUS']);

        this._socket.addListener('CONNECTED', this.onConnect, this);
        this._socket.addListener('ROOM_RESPONSE', this.onRoomResponse, this);
        this._socket.addListener('GAME_STATUS', this.onGameStatus, this);


        this._socket.connect('ws:/localhost:1337');
    }

    onConnect() {
        console.log('connected!!!!');


        this._socket.send('ROOM_REQUEST', {userName: 'web'});
    }

    onRoomResponse(data) {
        this.teamID = data.payload.playerIndex;
    }

    onGameStatus(data) {
        this.status = data.payload;
        this.callback && this.callback();
    }

    setUpdateCallback(callback) {
        this.callback = callback;
    }

    sendPath(player, path) {
        this._socket.send('SET_PATH', {playerID: player, path: path});
    }

    
}

export let app = new App();