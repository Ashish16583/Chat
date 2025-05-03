const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const moment = require('moment');
const PORT = 3000;

app.use(express.static('public'));

let users = {}; // socket.id -> { username, avatar, room }

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, avatar, room }) => {
    users[socket.id] = { username, avatar, room };
    socket.join(room);

    socket.broadcast.to(room).emit('message', {
      username: 'System',
      text: `${username} has joined.`,
      time: moment().format('h:mm A'),
    });
  });

  socket.on('chatMessage', (msg) => {
    const user = users[socket.id];
    if (!user) return;
    io.to(user.room).emit('message', {
      username: user.username,
      avatar: user.avatar,
      text: msg,
      time: moment().format('h:mm A'),
    });
  });

  socket.on('typing', () => {
    const user = users[socket.id];
    if (user) {
      socket.broadcast.to(user.room).emit('typing', user.username);
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      io.to(user.room).emit('message', {
        username: 'System',
        text: `${user.username} has left.`,
        time: moment().format('h:mm A'),
      });
      delete users[socket.id];
    }
  });
});

http.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
