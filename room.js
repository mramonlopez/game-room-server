'use strict';

const WebSocket = require('ws');

var Room = function(roomID, NUM_OF_PLAYERS, COUNTDOWN) {
    this.players = [];
    this.viewers = [];
    this.roomID = roomID;
    this._numOfPlayers = NUM_OF_PLAYERS;
    this.completed = false;
    this.onmessage = function() {};
    this.onPlayerEnrolled = function() {};
    this._countdownEndedCallback = function() {};

    this.setCountDown(COUNTDOWN);
};

Room.messages = {
    ROOM_REQUEST: 'ROOM_REQUEST',
    ROOM_RESPONSE: 'ROOM_RESPONSE',
    ACTIVE_ROOMS: 'ACTIVE_ROOMS',
    VIEW_ROOM: 'VIEW_ROOM',
    USER_ENROLLED: 'USER_ENROLLED'
};

Room.prototype.setCountDown = function(countdown) {
    this._countdown = countdown;

    if (countdown > 0) {
        this.interval = setInterval(this.intervalCallback.bind(this), 1000);
    }
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

Room.prototype.addPlayerConnection = function(connection, userInfo) {
    var numOfPlayers = this.players.length,
        playerPosition = -1;

    if (numOfPlayers >= this._numOfPlayers) {
        this.completed = true;
        return playerPosition;
    }

    playerPosition = numOfPlayers;
    numOfPlayers = this.players.push({
        connection: connection,
        userInfo: userInfo,
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
            userInfo: userInfo,
            playerIndex: playerPosition
        }
    };

    this.sendMessageToAllExcept(user_enrolled, playerPosition)

    // Send to new user all connected ones 
    for (var i = 0; i < numOfPlayers - 1; i++) {
        user_enrolled = {
            type: Room.messages.USER_ENROLLED,
            payload: {
                userInfo: this.players[i].userInfo,
                playerIndex: i
            }
        };

        this.sendMessageToPlayer(user_enrolled, playerPosition);
    }

    if (numOfPlayers >= this._numOfPlayers) {
        this.completed = true;
    }

    return playerPosition;
};

Room.prototype.addViewerConnection = function(connection) {
    this.viewers.push(connection);
}

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

    this.sendMessageToViewers(message);
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

    this.sendMessageToViewers(message);
};

Room.prototype.sendMessageToViewers = function(message) {
    for (var i = 0, len = this.viewers.length; i < len; i++) {
        var conn = this.viewers[i];

        if (conn.readyState === WebSocket.OPEN) {
            conn.send(JSON.stringify(message));
        } else {
            this.viewers.splice(i, 1); 
            i--;
            len = this.viewers.length;
        }
    }
}

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
