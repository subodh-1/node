const eventEmitter = require("./events"); 

eventEmitter.emit('userLoggedIn', 'suchoure');
eventEmitter.emit('userLoggedOut', 'suchoure');