'use strict';

var ChatServer = function(room) {
    this._room = room;
    this._users = [];
}

ChatServer.prototype.addPlayer = function(roomConnection, userInfo) {
    this._users[roomConnection.playerIndex] = userInfo;
};

// Called when countdown is over or room is full
ChatServer.prototype.start = function() {};

ChatServer.prototype.onMessage = function(userIndex, message) {
    switch (message.type) {
        case 'PUBLIC_MESSAGE':
            this._room.sendMessageToAllExcept(userIndex, message);
            break;
    }
};

// Shared properties
ChatServer.NUM_OF_PLAYERS = 10;
ChatServer.COUNTDOWN = 1; // Chat is open before room is full (1 seconds of pause)

module.exports = ChatServer;