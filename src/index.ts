import { Server, Socket } from 'socket.io';
import * as _ from 'lodash';

import { SOCKET_PORT } from './config';

const io = new Server(SOCKET_PORT, {
  cors: {
    origin: '*',
  },
});

interface RoomEvent {
  name: string;
  room: string;
}

interface MessageEvent {
  text: string;
}

const CHAT_CLIENTS: {
  socket: Socket;
  lastMessage: Date;
  room: string;
  name: string;
}[] = [];

const MESSAGE_TIMEOUT_IN_MS = 500;

io.on('connection', (socket) => {
  console.log('connection');

  const client = {
    socket,
    lastMessage: new Date(0),
    room: null,
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

    client.room = data.room;

    const sameNameClient = _.find(
      CHAT_CLIENTS,
      (chatClient) => chatClient.name === data.name,
    );

    if (sameNameClient) {
      socket.emit('bad_name');

      return;
    }

    client.name = data.name;

    io.to(client.room).emit('message_event', {
      name: client.name,
      text: `joined the room...`,
    });
  });

  socket.on('message_event', (data: MessageEvent) => {
    if (
      new Date().getTime() - client.lastMessage.getTime() <
      MESSAGE_TIMEOUT_IN_MS
    ) {
      socket.emit('message_event', {
        name: client.name,
        text: 'TIMEOUT_LIMIT_EXCEEDED',
      });

      return;
    }

    if (!data.text) {
      return;
    }

    if (data.text.length > 128) {
      socket.emit('message_event', {
        name: client.name,
        text: 'TEXT_TOO_LONG',
      });

      return;
    }

    io.to(client.room).emit('message_event', {
      name: client.name,
      text: data.text,
    });

    client.lastMessage = new Date();
  });
});

console.log('server_running');
