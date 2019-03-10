'use strict';

var Server = require('game-room-server/server');
var ChatServer = require('./modules/ChatServer');


var SOCKET = 1234;
var server = new Server(SOCKET, ChatServer);

server.start();

Server