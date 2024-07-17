// Connect to socket.io server
const socket = io();
// Connect to PeerServer
let myPeer = new Peer({
    host: '/',
    path: '/peerjs-server',
    port: 3001,
    //debug: 3
});
// Keep track of data connections with peers
const peers = {};



// Initiate peer to peer connections
let connectToPeer = (peerId) => {
    logMessage(`peerjs - myPeer connecting to ${peerId}...`);
    let connection = myPeer.connect(peerId);
    createPeerConnection(connection);
};

// Register peerjs dataConnection event handlers
const createPeerConnection = (connection) => {

    // When myPeer successfully connected to new peer
    connection.on('open', () => {
        logMessage(`peerjs - myPeer successfully connected to ${connection.peer}`);
        // Keep track of peer connections
        peers[connection.peer] = connection;
        logMessage(`peerjs - My connections ${Object.keys(peers).length}`);
    });

    // When myPeer receives data
    connection.on('data', (data) => {
        logMessage(`peerjs - myPeer received ${data}`);
    });

    // When myPeer closed connection with new peer
    connection.on('close', () => {
        logMessage(`peerjs - myPeer closed connection with ${connection.peer}`);
        removePeerConnection(connection.peer);
    });

    // When error
    connection.on('error', (error) => {
        logMessage(`peerjs - Error ${error}`);
    });
};
const removePeerConnection = (peerId) => {
    if (peers[peerId]) {
        peers[peerId].close();
        delete peers[peerId];
    }
    logMessage(`peerjs - myPeer closed connection with ${peerId}`);
    logMessage(`peerjs - myPeer connections ${Object.keys(peers).length}`);
};


// I connect with socket.io server
socket.on('connect', () => {
    logMessage('socket.io - I connected to socket.io server');
});
// When new client joined room, connect to new client (peer)
socket.on('client-joined-room', (roomId, clientId) => {
    logMessage(`socket.io - Client ${clientId} joined my room ${roomId}`);
    connectToPeer(clientId);
});
// When clients leave room, close peer connection
socket.on('client-left-room', (roomId, clientId) => {
    logMessage(`socket.io - Client ${clientId} left my room ${roomId}`);
    removePeerConnection(clientId);
});
// I disconnect with socket.io server
socket.on('disconnect', (reason) => {
    logMessage(`socket.io - My disconnection ${reason}`);
    socket.connect();
});
// socket.io connection error
socket.on('connect_error', (error) => {
    logMessage(`socket.io - My connect error ${error}`);
});


// When myPeer connected to PeerServer, join socket.io room
myPeer.on('open', (clientId) => {
    logMessage(`peerjs - myPeer ID is ${clientId}`);
    logMessage(`socket.io - myPeer requesting to join ${ROOM_ID}`);
    socket.emit('join-room', ROOM_ID, clientId, (response) => {
        logMessage(`socket.io - ${response}`);
    });
});
myPeer.on('connection', (connection) => {
    logMessage(`peerjs - myPeer established a new connection from a remote peer ${connection.peer}`);
    createPeerConnection(connection);
});
// myPeer is destroyed + can no longer accept or create any new connections + all connections to myPeer will be closed (destory just in case)
myPeer.on('close', () => {
    logMessage('peerjs - myPeer closed');
    myPeer.destroy();
    peers = {};
});
// myPeer is disconnected from signaling server (existing peer connection stay alive but cannot create new peer connections until reconnected)
myPeer.on('disconnected', () => {
    logMessage('peerjs - myPeer disconnected');
    myPeer.reconnect();
});
// Handle peerjs errors
myPeer.on('error', (error) => {
    logMessage(`peerjs - Error ${error}`);
});





// Display events
let logMessage = (message_content) => {
    let messages = document.getElementById('messages');
    let message = document.createElement('p');
    if (message_content.split(' - ')[0][0] === 'p') {
        message.classList.add('peer');
    } else {
        message.classList.add('socket');
    }
    message.textContent = message_content;
    messages.appendChild(message);
};