const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {};
let snakes = {};
const MAX_PLAYERS = 2; // Set maximum number of players to start the game
let waitingQueue = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('New player connected:', socket.id);

    socket.on('newPlayer', (name) => {
        // Add player to waiting queue
        waitingQueue.push({ id: socket.id, name });
        socket.emit('waiting', waitingQueue);

        // Notify all players in the queue
        io.emit('updateQueue', waitingQueue);

        // Start the game if the maximum players are reached
        if (waitingQueue.length === MAX_PLAYERS) {
            startGame();
        }
    });

    // Initialize player and snake when game starts
    socket.on('initializePlayer', () => {
        players[socket.id] = { x: Math.random() * 500, y: Math.random() * 500 };
        snakes[socket.id] = [{ x: players[socket.id].x, y: players[socket.id].y }];
        socket.emit('currentPlayers', players);
        socket.emit('snakeData', snakes);
        socket.broadcast.emit('newPlayer', { id: socket.id, player: players[socket.id] });
    });

    // Handle player movement
    socket.on('playerMove', (moveData) => {
        if (!players[moveData.id]) return; // Ensure player exists
        players[moveData.id] = moveData.position;
    
        const snake = snakes[moveData.id] || [];
        snake.unshift({ x: moveData.position.x, y: moveData.position.y });
    
        // Limit the snake's length to a maximum of 5 segments
        if (snake.length > 5) {
            snake.pop();
        }
    
        snakes[moveData.id] = snake;
        io.emit('updatePlayers', { players, snakes });
    });
    
    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        delete snakes[socket.id];
        waitingQueue = waitingQueue.filter(player => player.id !== socket.id);
        io.emit('disconnectPlayer', socket.id);
        io.emit('updateQueue', waitingQueue);
    });
});

function startGame() {
    // Notify all players that the game is starting
    io.emit('startGame');
    
    // Initialize players and snakes
    waitingQueue.forEach(player => {
        players[player.id] = { x: Math.random() * 500, y: Math.random() * 500 };
        snakes[player.id] = [{ x: players[player.id].x, y: players[player.id].y }];
        io.to(player.id).emit('currentPlayers', players);
        io.to(player.id).emit('snakeData', snakes);
    });

    waitingQueue = []; // Clear the waiting queue
}

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
