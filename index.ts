import * as SocketServer from 'socket.io';

const io = SocketServer(3000);

interface HelloMessage {
  name: string;
  room: string;
}

interface ChatMessage {
  name: string;
  room: string;
  text: string;
}

io.on('connection', socket => {
  console.log('connection');

  socket.on('hello', (data: HelloMessage) => {
    socket.join(data.room, () => {
      io.to(data.room).emit('chat_message', {
        ...data,
        text: `${data.name} joined the room...`
      });
    });
  });

  socket.on('chat_message', (data: ChatMessage) => {
    io.to(data.room).emit('chat_message', data);
  });
});

console.log('server started...');
