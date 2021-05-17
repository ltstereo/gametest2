'use strict';

const socket = io();

socket.on('status', message => {
    document.querySelector('#status').textContent = message;
});

socket.on('sign', message => {
    document.querySelector('#sign').textContent = message;
});

socket.on('state', state => {
    document
        .querySelectorAll('td')
        .forEach((cell, index) => (cell.textContent = state.board[index]));
    if (state.winner == 'X') {
        document.querySelector('#active').innerHTML =
            '<h3>The game is finished: Player X wins!</h3>';
    } else if (state.winner == 'O') {
        document.querySelector('#active').innerHTML =
            '<h3>The game is finished: Player O wins!</h3>';
    } else if (state.winner == 'draw') {
        document.querySelector('#active').innerHTML =
            '<h3>The game is finished: a draw!</h3>';
    } else if (state.winner == 'notFinished') {
        document.querySelector('#active').innerHTML =
            "<p>It's turn of " + state.active + ' now</p>';
    }
});

socket.on('showBoard', () => {
    document.querySelector('#restartButton').removeAttribute('hidden');
    document.querySelector('table').removeAttribute('hidden');
});

socket.on('showBoardSpec', () => {
    //document.querySelector("#newGame").removeAttribute("hidden");
    document.querySelector('table').removeAttribute('hidden');
    document.querySelector('table').style.pointerEvents = 'none';
    document.querySelector('#restartButton').style.pointerEvents = 'none';
});

socket.on('connectionError', message => {
    document.querySelector('#game').innerHTML = '<p>' + message + '</p>';
});

const init = () => {
    document.querySelector('#restartButton').addEventListener('click', event => {
        socket.emit('restartButton');
    });
    document.querySelectorAll('td').forEach((td, index) => {
        td.addEventListener('click', event => {
            socket.emit('move', index);
        });
    });
};

init();
