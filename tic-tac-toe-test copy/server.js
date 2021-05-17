'use strict';

const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);
const game = require('./gameModule.js');

const PORT = 8081;

app.use(express.static('public'));

let players = [];
let specs = [];

const getSignById = id => {
    return players.filter(player => player.socket.id === id)[0].sign;
};

const getIdBySign = sign => {
    return players.filter(player => player.sign === sign)[0].socket.id;
};

const assignSides = () => {
    [players[0].sign, players[1].sign] =
        Math.random() < 0.5 ? ['X', 'O'] : ['O', 'X'];
    console.log([players[0].sign, players[1].sign]);
    io.to(getIdBySign('X')).emit('sign', 'You play as X');
    io.to(getIdBySign('O')).emit('sign', 'You play as O');
};

const startNewGame = () => {
    game.reset();
    io.emit('status', 'Two players are connected. You can start the game!');
    assignSides();
    game.start();
    io.emit('state', game.state);
    io.emit('showBoard');
};

const isGameFinished = () => {
    if (game.checkWinner('X')) {
        game.state.winner = 'X';
    } else if (game.checkWinner('O')) {
        game.state.winner = 'O';
    } else if (game.checkDraw()) {
        game.state.winner = 'draw';
    }
};

//when a new client is connectingy
io.on('connection', socket => {
    console.log(`Player(socket id = ${socket.id}) is connected`);
    const clientsCount = io.engine.clientsCount;
    //when player makes a turn, we get the clicked cell as an argument
    socket.on('move', cell => {
        //and get the sign of active player
        const activePlayer = getSignById(socket.id);
        //check, if the turn is valid
        const validationResult = game.isTurnValid(activePlayer, cell);
        if (!validationResult.valid) {
            socket.emit('status', validationResult.message);
        } else {
            //update game state
            game.move(activePlayer, cell);
            //check, if win conditions are fulfilled
            isGameFinished();
            //send new state to players
            io.emit('state', game.state);
            io.emit('status');
            if (game.state.winner === 'notFinished') {
                io.to(getIdBySign(game.state.active)).emit(
                    'status',
                    'Your turn!',
                );
            }
        }
    });

    //when button "new game" is clicked
    socket.on('restartButton', () => {
        startNewGame();
    });

    //when one player is disconnected
    socket.on('disconnect', () => {
        console.log(`Player (socket id: ${socket.id}) is disconnected`);
        //check, if the player, who takes part in game, is disconnected
        if (players.some(p => p.socket.id === socket.id)) {
            game.reset();
            players = players.filter(player => player.socket.id !== socket.id);
            players.forEach(player => {
                player.socket.emit(
                    'connectionError',
                    'Your partner left game. Please refresh your page to start a new game.',
                );
                player.socket.disconnect();
            });
            specs = specs.filter(specs => specs.socket.id !== socket.id);
            specs.forEach(specs => {
                specs.socket.emit(
                    'connectionError',
                    'Players left the game. Please refresh your page to start a new game.',
                );
                specs.socket.disconnect();
            });
        }
    });

    //when first player is connecting

    if (clientsCount === 1) {
        players.push({ socket: socket });
        socket.emit('status', 'Please wait for a second player!');
    }

    //when second player is connecting
    if (clientsCount === 2) {
        players.push({ socket: socket });
        startNewGame();
    }

    //when third player is connecting
    if (clientsCount > 2) {
        specs.push({ socket: socket });
        socket.emit('showBoardSpec');
        socket.emit('status', 'This game is already in progress.');
        socket.emit('sign', 'You can only spectate.');
        socket.emit('state', game.state);

        //socket.disconnect();
    }
    console.log(clientsCount);
});


httpServer.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
