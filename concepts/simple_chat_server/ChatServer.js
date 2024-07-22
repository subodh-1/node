const EventEmitter = require('events');

class ChatServer extends EventEmitter {
  constructor() {
    super();
    this.rooms = new Map();
  }

  createRoom(roomName) {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
      this.emit('roomCreated', roomName);
    }
  }

  joinRoom(roomName, client) {
    if (this.rooms.has(roomName)) {
      this.rooms.get(roomName).add(client);
      this.emit('clientJoined', roomName, client);
    }
  }

  sendMessage(roomName, client, message) {
    if (this.rooms.has(roomName)) {
      for (const otherClient of this.rooms.get(roomName)) {
        if (otherClient !== client) {
          otherClient.receive(message);
        }
      }
      this.emit('messageReceived', roomName, client, message);
    }
  }
}

module.exports = ChatServer; // Export the ChatServer class