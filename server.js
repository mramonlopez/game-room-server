var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var Room = require('./Room');

var Server = function(socket, Game) {
    this.activeGames = {},
        this.currentRoom = undefined;
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
            if (parsed.payload.roomID && parsed.payload.playerIndex) {

                var room = this.activeGames[parsed.payload.roomID].room;

                room.reconectPlayer(parsed.payload.playerIndex);
            } else { // New player
                var game;

                if (!this.currentRoom) {
                    // New room
                    var roomID = 'room' + ((new Date()).getTime()).toString();

                    this.currentRoom = new Room(roomID, this.Game.NUM_OF_PLAYERS, this.Game.COUNTDOWN);
                    game = new this.Game(this.currentRoom);

                    this.activeGames[this.currentRoom.roomID] = game;

                    if (this.Game.COUNTDOWN) {
                        var server = this;

                        this.currentRoom.onCountdownEnded(function() {
                            game.start();
                            server.currentRoom = undefined;
                         });
                    }                    
                } else {
                    game = this.activeGames[this.currentRoom.roomID];
                }

                // Add player to room and game
                var playerIndex = this.currentRoom.addPlayerConnection(ws, parsed.payload.userName);
                game.addPlayer(this.currentRoom.players[playerIndex]);

                if (this.currentRoom.completed) {
                    this.currentRoom = undefined;

                    // Only if Game hasn't a pregame countdown period
                    if (!this.Game.COUNTDOWN) {
                        game.start();
                    }
                }
            }
        }
    };

    ws.once('message', onMessage.bind(this));
};

module.exports = Server;
