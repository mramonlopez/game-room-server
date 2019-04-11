var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var Room = require('./room');

var Server = function(socket, Game) {
    this.activeGames = {
        games: {},
        roomIDs: []
    },
    this.currentRoom = null;
    this.socket = socket;
    this.Game = Game || function() {};
};

Server.prototype.start = function() {
    var app = express();
    var port = process.env.PORT || this.socket;

    app.use(express.static(__dirname + "/"))

    var server = http.createServer(app);
    server.listen(port);

    var wss = new WebSocketServer({
        server: server
    });
    wss.on("connection", this.onConnection.bind(this));
};

Server.prototype.onConnection = function(ws) {
    var onMessage;

    onMessage = function(message) {
        var parsed = JSON.parse(message);

        if (parsed.type === Room.messages.ROOM_REQUEST) {
            // Reconnect player
            this.onRoomRequest(parsed, ws);
        } else if (parsed.type === Room.messages.ACTIVE_ROOMS) {
            this.onRoomListRequest(ws);
            ws.close(1000, 'ROOMS LISTED');
        } else if (parsed.type === Room.messages.VIEW_ROOM) {
            this.onViewRoom(parsed.payload, ws);
        }
    };

    ws.once('message', onMessage.bind(this));
};

Server.prototype.onRoomListRequest = function(ws) {
    var message = {
        type: 'ROOM_LIST',
        payload: []
    };

    var start, end;

    if (this.activeGames.roomIDs.length > this.Game.MAX_ROOMS) {
        start = Math.floor(Math.random() * (1 + this.activeGames.roomIDs.length - this.Game.MAX_ROOMS));
        end = start + this.Game.MAX_ROOMS;
    } else {
        start = 0;
        end = this.activeGames.roomIDs.length;
    }

    for(var i = start; i < end; i++) {
        var roomID = this.activeGames.roomIDs[i];

        // Skip (incomplete) current room
        if (this.activeGames.games.hasOwnProperty(roomID) && (this.currentRoom === null || this.currentRoom.roomID !== roomID)) {
            var room = {
                roomID: roomID,
                gameInfo: this.activeGames.games[roomID].getGameInfo()
            };

            message.payload.push(room);
        }
    }
    
    ws.send(JSON.stringify(message));
};

Server.prototype.onViewRoom = function(roomID, ws) {
    if (this.activeGames.games.hasOwnProperty(roomID) && (!this.currentRoom || this.currentRoom.roomID !== roomID)) {
        this.activeGames.games[roomID].getRoom().addViewerConnection(ws);
    }
};

Server.prototype.onRoomRequest = function(parsed, ws) {
    if (parsed.payload.roomID && parsed.payload.playerIndex) {
        var room = this.activeGames.games[parsed.payload.roomID].room;
        room.reconectPlayer(parsed.payload.playerIndex);
    }
    else { // New player
        var game;
        if (!this.currentRoom) {
            // New room
            var roomID = 'room' + ((new Date()).getTime()).toString();
            this.currentRoom = new Room(roomID, this.Game.NUM_OF_PLAYERS, this.Game.COUNTDOWN);
            game = new this.Game(this.currentRoom);
            
            this.activeGames.games[this.currentRoom.roomID] = game;
            this.activeGames.roomIDs.push(roomID);

            if (this.Game.COUNTDOWN) {
                var server = this;
                this.currentRoom.onCountdownEnded(function () {
                    game.start();
                    server.currentRoom = null;
                });
            }
        } else {
            game = this.activeGames.games[this.currentRoom.roomID];
        }
        // Add player to room and game
        var playerIndex = this.currentRoom.addPlayerConnection(ws, parsed.payload.userInfo);
        game.addPlayer(this.currentRoom.players[playerIndex], parsed.payload);
        if (this.currentRoom.completed) {
            this.currentRoom = null;
            // Only if Game hasn't a pregame countdown period
            if (!this.Game.COUNTDOWN) {
                game.start();
            }
        }
    }
}

module.exports = Server;