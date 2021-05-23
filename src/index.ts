import { Server, Socket } from 'socket.io';
import * as _ from 'lodash';

const io = new Server(8000, {
  cors: {
    origin: '*',
  },
});

interface RoomEvent {
  name: string;
  room: string;
}

interface MessageEvent {
  name: string;
  room: string;
  text: string;
}

const CHAT_CLIENTS: {
  socket: Socket;
  lastMessage: Date;
  name: string;
}[] = [];

const MESSAGE_TIMEOUT_IN_MS = 500;

io.on('connection', (socket) => {
  console.log('connection');

  const client = {
    socket,
    lastMessage: new Date(0),
    name: null,
  };

  CHAT_CLIENTS.push(client);

  socket.on('disconnect', () => {
    console.log('disconnect');

    _.remove(CHAT_CLIENTS, (chatClient) => {
      return chatClient === client;
    });
  });

  socket.on('room_event', async (data: RoomEvent) => {
    if (!data.room) {
      return;
    }

    if (data.room.length > 128) {
      return;
    }

    await socket.join(data.room);

    const sameNameClient = _.find(
      CHAT_CLIENTS,
      (chatClient) => chatClient.name === data.name,
    );

    if (sameNameClient) {
      socket.emit('bad_name');

      return;
    }

    client.name = data.name;

    io.to(data.room).emit('message_event', {
      ...data,
      text: `joined the room...`,
    });
  });

  socket.on('message_event', (data: MessageEvent) => {
    if (
      new Date().getTime() - client.lastMessage.getTime() <
      MESSAGE_TIMEOUT_IN_MS
    ) {
      socket.emit('message_event', {
        ...data,
        text: 'TIMEOUT_LIMIT_EXCEEDED',
      });

      return;
    }

    if (!data.text) {
      return;
    }

    if (data.text.length > 128) {
      socket.emit('message_event', {
        ...data,
        text: 'TEXT_TOO_LONG',
      });

      return;
    }

    io.to(data.room).emit('message_event', data);

    client.lastMessage = new Date();
  });
});

console.log('server_running');
