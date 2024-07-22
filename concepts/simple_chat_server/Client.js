const EventEmitter = require('events')

class Client extends EventEmitter {
    constructor(name) {
        super();
        this.name = name;
    }

    receive(message){
        console.log(`${this.name} received: ${message}`);
    }

}
module.exports = Client