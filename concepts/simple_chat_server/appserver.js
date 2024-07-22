const ChatServer = require('./ChatServer');
const Client = require('./Client');
const readline = require('readline');

const chatServer = new ChatServer();
const clients = {};

// Create an interface for reading input from the command line
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
const promptUser = () => {
  rl.question('Enter your name: ', (name) => {
    const client = new Client(name);
    clients[name] = client;

    client.on('messageReceived', (message) => {
      console.log(message);
    });

    rl.question('Enter room name to create or join: ', (roomName) => {
      chatServer.createRoom(roomName);
      chatServer.joinRoom(roomName, client);

      console.log(`Welcome to the room "${roomName}", ${name}!`);

      // Start listening for messages
      sendMessageLoop(roomName, client);
    });
  });
};

// Function to handle sending messages
const sendMessageLoop = (roomName, client) => {
  rl.on('line', (input) => {
    if (input.trim()) {
      chatServer.sendMessage(roomName, client, `${client.name}: ${input}`);
    }
  });
};

// Start the application
promptUser();