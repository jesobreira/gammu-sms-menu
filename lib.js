
const gammu = require('node-gammu-json');
const moment = require('moment');
const wildcard = require('wildcard');
const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const server = gammu.create({ interval: 2 });

var events = {};
var sessions = {};

var smsMenu = {
		"on": function(event, cb) {
			events.global = {};
			events.global[event] = cb;
			return smsMenu;
		}
	}

const eventEmitter = function(session) {
	this.events = {};
	this.session = session;
	var upperThis = this;
	this.on_set = function(event, cb) {
		upperThis.events[event] = cb;
		return;
	}
	this.emit_do = function(event) {
		if(typeof upperThis.events[event] != 'undefined') {
			return upperThis.events[event](upperThis.session);
		}
	}
	return this;
}

// session structure
const session = function(svr) {
	this.case_sensitive = true;
	this.auto_trim = true;
	this.timeOut = 60*5;

	this.lastMessage = null;
	this.lastMessageSentAt = null;
	this.phoneNumber = null;
	this.startedAt = moment();
	this.events = eventEmitter(this);

	var upperThis = this;

	this.on = function(event, cb) {
		upperThis.events.on_set(event, cb);
		return cb;
	}

	this.emit = function(event) {
		return upperThis.events.emit_do(event);
		return upperThis;
	}

	this.send = function(message, cb) {
		if(upperThis.phoneNumber=='std')
			console.log("< "+message);
		else
			svr.send(upperThis.phoneNumber, message);

		if(typeof cb != 'undefined') upperThis.on('received', cb);

		return this;
	}

	this.restart = function() {
		upperThis.events.emit_do('start');
		return upperThis;
	}

	this.returnTo = function(state) {
		upperThis.on('received', state);
		return upperThis;
	}

	this.close = function() {
		delete this;
	}

	return this;
}

const recvCb = function (_message, _callback) {
    if(typeof sessions[_message.from] == 'undefined') {
    	// create a new session
    	sessions[_message.from] = session(this);
    	var evt = 'start';
    	sessions[_message.from].on('start', events.global.session);
    } else {
    	// check for timeout
    	if(moment().isAfter(sessions[_message.from].lastMessageSentAt.add(sessions[_message.from].timeOut, 'seconds'))) {
    		sessions[_message.from].emit('timeout');
    		var evt = 'start';
    		sessions[_message.from] = session(this);
    		sessions[_message.from].on('start', events.global.session);
    	} else {
    		var evt = 'received';
    	}
    }
    sessions[_message.from].phoneNumber = _message.from;
	sessions[_message.from].lastMessage = _message.content;
	sessions[_message.from].lastMessageSentAt = moment();

	sessions[_message.from].emit(evt);
    _callback();
  }

var smsServer = server.on({
  receive: recvCb,

  error: function (_error, _message) {
    throw Error(_error+' '+_message);
  }
});

smsMenu.start = function() {
	smsServer.start();
}

smsMenu.debug = function() {
	rl.question("> ", function(msg) {
		recvCb({
			from: 'std',
			content: msg
		}, smsMenu.debug)
	});
}


module.exports = smsMenu;
