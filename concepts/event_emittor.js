const EventsEmitter  = require('events');

const MyEmitter = new EventsEmitter();

MyEmitter.on('myEvents', (arg1, arg2) => {
    console.log("myEvent emitted with arguments: {"+arg1+", " + arg2 +"}");
});

MyEmitter.emit('myEvents', 'Subodh', 'Choure');