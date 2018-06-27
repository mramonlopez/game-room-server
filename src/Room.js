'use strict';

const WebSocket = require('ws');

var Room = function(roomID, NUM_OF_PLAYERS, COUNTDOWN) {
    this.players = [];
    this.roomID = roomID;
    this._numOfPlayers = NUM_OF_PLAYERS;
    this._countdown = COUNTDOWN;
    this.completed = false;
    this.onmessage = function() {};
    this.onPlayerEnrolled = function() {};
    this._countdownEndedCallback = function() {};

    if (COUNTDOWN > 0) {
        this.interval = setInterval(this.intervalCallback.bind(this), 1000);
    }
};

Room.messages = {
    ROOM_REQUEST: 'ROOM_REQUEST',
    ROOM_RESPONSE: 'ROOM_RESPONSE',
    USER_ENROLLED: 'USER_ENROLLED',
};

Room.prototype.intervalCallback = function() {
    this._countdown--;

    var message = {
        type: 'COUNTDOWN',
        payload: this._countdown
    };

    this.sendMessageToAll(message);

    if (this._countdown <= 0) {
        clearInterval(this.interval);

        this._countdownEndedCallback();
    }
};

Room.prototype.onCountdownEnded = function(callback) {
    this._countdownEndedCallback = callback;
}

Room.prototype.addPlayerConnection = function(connection, userName) {
    var numOfPlayers = this.players.length,
        playerPosition = -1;

    if (numOfPlayers < this._numOfPlayers) {
        playerPosition = numOfPlayers;
        numOfPlayers = this.players.push({
            connection: connection,
            userName: userName,
            playerIndex: playerPosition,
        });
        
        // Notify to client its room id
        var response = {
            type: Room.messages.ROOM_RESPONSE,
            payload: {
                roomID: this.roomID,
                playerIndex: playerPosition,
                totalPlayers: this._numOfPlayers,
                currentPlayers: this.players.length
            }
        };

        this.sendMessageToPlayer(response, playerPosition);

        // Notify to all enrolled player the new user added
        var user_enrolled = {
            type: Room.messages.USER_ENROLLED,
            payload: {
                userName: userName,
                playerIndex: playerPosition
            }
        };

        this.sendMessageToAllExcept(user_enrolled, playerPosition)

        // Send to client all connected user
        for (var i = 0; i < numOfPlayers - 1; i++) {
            user_enrolled = {
                type: Room.messages.USER_ENROLLED,
                payload: {
                    userName: this.players[i].userName,
                    playerIndex: i
                }
            };

            this.sendMessageToPlayer(user_enrolled, playerPosition);
        }

        if (numOfPlayers >= this._numOfPlayers) {
            this.completed = true;
        }
    }

    return playerPosition;
};

Room.prototype.reconectPlayer = function(playerIndex, connection) {
    this.players[playerIndex].connection = connection;

    // TODO: format message correctly
    this.sendMessageToAllExcept('RECONECTED', playerIndex);
};

Room.prototype.sendMessageToPlayer = function(message, player) {
    var conn = this.players[player].connection;

	if (conn.readyState === WebSocket.OPEN) {
		conn.send(JSON.stringify(message));
	}
};

Room.prototype.sendMessageToAll = function(message) {
    for (var i = 0, len = this.players.length; i < len; i++) {
        var conn = this.players[i].connection;

        if (conn.readyState === WebSocket.OPEN) {
            conn.send(JSON.stringify(message));
        }
    }
};

Room.prototype.sendMessageToAllExcept = function(message, player) {
    for (var i = 0, len = this.players.length; i < len; i++) {
        if (i !== player) {
            var conn = this.players[i].connection;

			if (conn.readyState === WebSocket.OPEN) {
	            conn.send(JSON.stringify(message));
	        }
        }
    }
};

Room.prototype.startListening = function() {
    for (var i = 0, len = this.players.length; i < len; i++) {
        var conn = this.players[i].connection,
            thisRoom = this;

        conn.on('message', (function(player) {
            return function(msg) {
                var message = JSON.parse(msg);

                thisRoom.onmessage(player, message);
            }
        })(i));
    }
};

Room.prototype.close = function() {
    for (var i = 0, len = this.players.length; i < len; i++) {
        this.players[i].connection.close(1000, 'ROOM CLOSED');
    }
};

module.exports = Room;
