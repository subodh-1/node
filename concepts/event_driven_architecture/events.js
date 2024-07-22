const EventsEmitter = require('events');

const myEvent = new EventsEmitter();

myEvent.on('userLoggedIn', (username) => {
    console.log("User: "+username+" logged in successfully!!");
})

myEvent.on('userLoggedOut', (username) => {
    console.log("User: "+ username + " logged out successfully!!" );
});

module.exports = myEvent;