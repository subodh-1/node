const ChatServer = require('./ChatServer');
const Client = require('./Client');

const chatServer = new ChatServer();

const alice = new Client('Alice');
const bob = new Client('Bob');
const charlie = new Client('Charlie');

chatServer.on('roomCreated', (roomName) => {
  console.log(`Room "${roomName}" created.`);
});

chatServer.on('clientJoined', (roomName, client) => {
  console.log(`${client.name} joined room "${roomName}".`);
});

chatServer.on('messageReceived', (roomName, client, message) => {
  console.log(`Message received in room "${roomName}" from ${client.name}: ${message}`);
});

chatServer.createRoom('general');
chatServer.joinRoom('general', alice);
chatServer.joinRoom('general', bob);
chatServer.joinRoom('general', charlie);

chatServer.sendMessage('general', alice, 'Hello, everyone!');