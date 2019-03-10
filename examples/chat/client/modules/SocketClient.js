'use strict';
import EventDispatcher from './EventDispatcher';

/**
 * Class Web Socket Client.
 * Implements server communications via webSocket.
 * @extends EventDispatcher
 * @class
 */

class SocketClient extends EventDispatcher {
    /**
     * Contructor of the class. Some properties are created.
     * @constructor
     */
    constructor() {
        super(true);
        this._socket = null;
        this.addEvents(['CONNECTED', 'DISCONNECTED', 'ERROR']);

    }
    /**
     * Websocket and his callbacks are created with dispatcher. The communication with server will be open.
     * @param {String} url - Socket server's URL
     */
    connect(url) {
        const onOpen = () => {
            this.dispatch('CONNECTED', {'status': 'CONNECTED'});
        };

        const onError = (error) => {
            this.dispatch('ERROR', {'status': 'ERROR', 'error': error});
        };

        const onMessage = (message) => {
            var data = JSON.parse(message.data);
            if (!data.hasOwnProperty('type')) {
                throw 'Message has not a type property';
            }

            this.dispatch(data.type, data);
        };

        const onClosed = () => {
            this.dispatch('DISCONNECTED', {'status': 'DISCONNECTED'});
        };

        this._socket = new WebSocket(url);
        this._socket.onopen = onOpen;
        this._socket.onerror = onError;
        this._socket.onmessage = onMessage;
        this._socket.onclosed = onClosed;
    }
    /**
     * Sends message data to webSocket server
     * @param {String} messageType - ID of message type
     * @param {Object} payload - Object containing message data (payload)
     */
    send(messageType, payload) {
        if (this._socket.readyState !== 1) {
            throw 'Connection not ready';
        }

        let copy = {};

        copy.payload = JSON.parse(JSON.stringify(payload));
        copy.type = messageType;

        this._socket.send(JSON.stringify(copy));
    }

}
export default SocketClient;
