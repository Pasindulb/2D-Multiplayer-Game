const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let players = {};
let snakes = {};
let playerId;
let playerName;

// Event listener for starting the game
document.getElementById('startButton').addEventListener('click', () => {
    playerName = document.getElementById('playerName').value;
    socket.emit('newPlayer', playerName);
});

// Update the waiting queue
socket.on('updateQueue', (queue) => {
    const queueDiv = document.getElementById('queue');
    queueDiv.innerHTML = 'Waiting Players: ' + queue.map(player => player.name).join(', ');
});

// Notify when the game starts
socket.on('startGame', () => {
    canvas.style.display = 'block'; // Show the canvas
    document.getElementById('queue').style.display = 'none'; // Hide the queue
    socket.emit('initializePlayer'); // Initialize player and snake
});

// Handle receiving the current players
socket.on('currentPlayers', (currentPlayers) => {
    players = currentPlayers;
});

// Handle new player connection
socket.on('newPlayer', (data) => {
    players[data.id] = data.player;
});

// Handle player movement updates
socket.on('updatePlayers', (data) => {
    players = data.players;
    snakes = data.snakes;
});

// Handle player disconnection
socket.on('disconnectPlayer', (id) => {
    delete players[id];
    delete snakes[id];
});

// Draw the game
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw players
    for (let id in players) {
        const player = players[id];
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x, player.y, 10, 10);
    }

    // Draw snakes
    for (let id in snakes) {
        const snake = snakes[id];
        ctx.fillStyle = 'green';
        for (let segment of snake) {
            ctx.fillRect(segment.x, segment.y, 10, 10);
        }
    }

    requestAnimationFrame(draw);
}

// Start drawing the game when the game starts
draw();

// Handle player movement
document.addEventListener('keydown', (event) => {
    if (!playerId) return; // Prevent movement before player is initialized

    const moveData = { id: playerId, position: {} };

    // Determine the movement based on key pressed
    switch (event.key) {
        case 'ArrowUp':
            moveData.position.y = (players[playerId].y - 10); // Move up
            moveData.position.x = players[playerId].x;
            break;
        case 'ArrowDown':
            moveData.position.y = (players[playerId].y + 10); // Move down
            moveData.position.x = players[playerId].x;
            break;
        case 'ArrowLeft':
            moveData.position.x = (players[playerId].x - 10); // Move left
            moveData.position.y = players[playerId].y;
            break;
        case 'ArrowRight':
            moveData.position.x = (players[playerId].x + 10); // Move right
            moveData.position.y = players[playerId].y;
            break;
        default:
            return; // Exit this handler for other keys
    }

    // Emit movement data to the server
    socket.emit('playerMove', moveData);
});
