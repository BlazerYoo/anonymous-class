const express = require('express');
const app = express();
const server = require('http').Server(app);
const options = { cleanupEmptyChildNamespaces: true };
const io = require('socket.io')(server, options);
const { PeerServer } = require('peer');
const { v4: uuidV4 } = require('uuid');



// Use EJS + static files
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Generate random roomId
app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

app.get('/:room', (req, res) => {
    res.render('room-view', { roomId: req.params.room });
});



// Start PeerServer
const peerServer = PeerServer({
    //debug: true,
    path: '/peerjs-server',
    port: 3001
});

// Client connects to PeerServer
peerServer.on('connection', (client) => {
    console.log(`peerjs - Client ${client.getId()} connected to PeerServer`);
});

// Client disconnects from PeerServer
peerServer.on('disconnect', (client) => {
    console.log(`peerjs - Client ${client.getId()} disconnected from PeerServer`);
});



// Client connects to socket.io server
io.on('connection', (socket) => {

    console.log('socket.io - A client connected to socket.io server');

    // Client requested to join-room
    socket.on('join-room', (roomId, clientId, callback) => {

        console.log(`socket.io - Client ${clientId} requested to join room ${roomId}`);

        // Add client to assigned room
        socket.join(roomId);
        console.log(`socket.io - Client ${clientId} added to room ${roomId}`);

        // Alert clients in room that new client joined
        socket.to(roomId).emit('client-joined-room', roomId, clientId);

        // Save roomId and clientId
        socket.data.roomId = roomId;
        socket.data.clientId = clientId;

        // Server acknowledgement and response to join-room event
        callback(`SERVER RESPONSE - socket.io - Client ${clientId} successfully added to room ${roomId}`);
    });

    // Client is going to be disconnected (but hasn't left its rooms yet)
    socket.on('disconnecting', (reason) => {
        let roomId = socket.data.roomId;
        let clientId = socket.data.clientId;
        if (roomId && clientId) {
            console.log(`socket.io - Client ${clientId} disconnecting from socket.io server because ${reason}`);
            socket.to(roomId).emit('client-left-room', roomId, clientId);
        } else {
            console.log(`socket.io - A client (with no connection with PeerServer & no assigned socket.io room) disconnecting from socket.io server because ${reason}`);
        }
    });

    // Client disconnected from socket.io server
    socket.on('disconnect', (reason) => {
        let roomId = socket.data.roomId;
        let clientId = socket.data.clientId;
        if (roomId && clientId) {
            console.log(`socket.io - Client ${clientId} disconnected from socket.io server because ${reason}`);
        } else {
            console.log(`socket.io - A client (with no connection with PeerServer & no assigned socket.io room) disconnected from socket.io server because ${reason}`);
        }
    });
});



// Connection is abnormally closed
io.engine.on("connection_error", (err) => {
    console.log(err.req);      // the request object
    console.log(err.code);     // the error code, for example 1
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
});



// Start server
server.listen(process.env.PORT || 3000, () => {
    console.log(`App started listening on port ${server.address().port}`);
});
