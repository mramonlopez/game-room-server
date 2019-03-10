'use strict';

/**
 * Generic event dispatcher
 * @class EventDispatcher
 * if dispatched or listened event is not suported.
 */
class EventDispatcher {
    /**
     * Contructor of the class. Some properties are created.
     * @param {Boolean} eventChecking - If true, dispatcher check and throw errors
     * @constructor
     */
    constructor(eventChecking) {
        this._checkEvent = !!eventChecking;
        this._listeners = {};
    }
    /**
     * Add a list of suported events
     * @param {Array} eventList - String array width list of events.
     */

    addEvents(eventList) {
        if (!Array.isArray(eventList)) {
            throw 'Event list should be an Array';
        }

        eventList.forEach(event => {
            // Check if event is new
            if (!this._listeners.hasOwnProperty.hasOwnProperty(event)) {
                this._listeners[event] = [];
            }
        });
    }

    /**
     * Remove a list of event from suported ones
     * @param {Array} eventList - String array width list of event.
     */
    removeEvents(eventList) {
        if (!Array.isArray(eventList)) {
            throw 'Event list should be an Array';
        }

        eventList.forEach(function (event) {
            // Check if event is new
            if (this._listeners.hasOwnProperty(event)) {
                delete this._listeners[event];
            }
        }, this);
    }

    /**
     * Add a event listener. If event to be listend is no registered with addEvents
     * and event cheking is active, method throws an error.
     * @param {String} event - Name of event to be listened.
     * @param {Function} callback - Function to be called when event is dispatched.
     * @param {Object} context - Context to be used when callback is launched.
     */
    addListener(event, callback, context) {
        if (!this._listeners.hasOwnProperty(event)) {
            throw 'Event "' + event + '" not suported.';
        }

        this._listeners[event].push({
            callback: callback,
            context: context
        });
    }

    /**
     * Launch event to all registered listeners. If event to be launched is no
     * registred with addEvents and event cheking is active, method throws an error.
     * @param {String} event - Name of event to be launched.
     * @param {Any} payload - Data sent to listeners. Data is clones to guarantee
     * inmutability, so functions can't be pased here.
     */
    dispatch(event, payload) {
        if (!this._listeners.hasOwnProperty(event)) {
            throw 'Event "' + event + '" not suported.';
        }

        this._listeners[event].forEach(function (listener) {
            var copyPL;

            if (payload !== undefined && payload !== null) {
                copyPL = JSON.parse(JSON.stringify(payload));
            } else {
                copyPL = undefined;
            }
            listener.callback.call(listener.context, copyPL);
        }, this);
    }

}
export default EventDispatcher;
