'use strict';

var ChatServer = function(room) {
    this._room = room;
    this._room.onmessage = this.onMessage.bind(this);
    this._users = [];
}

ChatServer.prototype.addPlayer = function(roomConnection, userInfo) {
    this._users[roomConnection.playerIndex] = userInfo;
    console.log("User enrolled:", userInfo);
};

// Called when countdown is over or room is full
ChatServer.prototype.start = function() {
    this._room.startListening();
    console.log("Chat open");
};

ChatServer.prototype.onMessage = function(userIndex, message) {
    switch (message.type) {
        case 'PUBLIC_MESSAGE':
            var response = {
                type: 'PUBLIC_MESSAGE',
                payload: {
                    user: this._users[userIndex].userName,
                    message: message.payload.message
                }
            }
            this._room.sendMessageToAllExcept(response, userIndex);
            console.log('Renviando:', message);
            break;
        default:
            console.log('What!?!?:', message.type);
    }
};

// Shared properties
ChatServer.NUM_OF_PLAYERS = 10;
ChatServer.COUNTDOWN = 10; // Chat is open before room is full (10 seconds of pause)

module.exports = ChatServer;