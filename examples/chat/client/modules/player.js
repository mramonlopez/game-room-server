'use strict';

var SPEED = 500;

var Player = function (game, x, y, playerID) {
	Phaser.Sprite.call(this, game, x, y, 'player');

    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.playerID = playerID;

    this._movedCallback = function () {};
    this._movedCallbackContext = undefined;

	this._selectedCallback = function () {};
    this._selectedCallbackContext = undefined;

	this._onInputUpCallback = function () {};
    this._onInputUpCallbackContext = undefined;

    this.inputEnabled = true;
    this.events.onInputDown.add(this.onInputDown, this);
    this.events.onInputUp.add(this.onInputUp, this);

    console.log('Player ', playerID, 'created');
};

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

Player.prototype.onInputDown = function () {
	if (!this.traking && !this.moving) {
		this._selectedCallback.call(this._selectedCallbackContext, this.playerID);
		this.traking = true;
	}
};

Player.prototype.onInputUp = function () {
	if (this.traking && !this.moving) {
		this._onInputUpCallback.call(this._onInputUpCallbackContext, this.playerID);
		this.traking = false;
	}
};

Player.prototype.moveTroughtPath = function (path) {
	this._path = path;
	this.moving = true;

	if (this._path.length > 0) {
        var point = this._path[0],
            firstTween = this.game.add.tween(this).to({x: point.x, y: point.y}, SPEED), 
            prevTween = firstTween,
            currentTween;

        for (var i = 1, len = this._path.length; i < len; i++) {
          point = this._path[i];
          currentTween = this.game.add.tween(this).to({x: point.x, y: point.y}, SPEED);
          prevTween.chain(currentTween);

          prevTween = currentTween;
        }

        currentTween.onComplete.addOnce(function() {
          this.moving = false; 
          this._movedCallback.call(this._movedCallbackContext, this.playerID, this._path);
          this._path = [];
        }, this);

        firstTween.start();
      } else {
        this.moving = false;  
      }
};

Player.prototype.addMovedCallback = function (callback, context) {
	this._movedCallback = callback;
	this._movedCallbackContext = context;
};

Player.prototype.addSelectedCallback = function (callback, context) {
	this._selectedCallback = callback;
	this._selectedCallbackContext = context;
};

Player.prototype.addInputUpCallback = function (callback, context) {
	this._onInputUpCallback = callback;
	this._onInputUpCallbackContext = context;
};

module.exports = Player;


