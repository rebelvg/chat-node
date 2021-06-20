import * as fs from 'fs';

const config = JSON.parse(
  fs.readFileSync('./config.json', { encoding: 'utf-8' }),
);

console.log('config', config);

export const SOCKET_PORT = config.SOCKET_PORT;
