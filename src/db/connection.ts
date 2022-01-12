import EventEmitter = require('events');
import {createConnection, Connection} from 'mongoose';

let connection: Connection | null = null;
const emittersMap: Record<string, EventEmitter> = {};
const connectingMap: Record<string, true> = {};
const openEventName = 'open';
const errorEventName = 'error';

export function getMongoConnection(uri: string): Promise<Connection> {
  return new Promise((resolve, reject) => {
    if (connection) {
      resolve(connection);
    }

    if (connectingMap[uri]) {
      emittersMap[uri]?.addListener(openEventName, resolve);
      emittersMap[uri]?.addListener(errorEventName, reject);
      return;
    }

    connectingMap[uri] = true;
    connection = createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    connection.once('open', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      emittersMap[uri]?.emit(openEventName, connection);
      delete emittersMap[uri];
    });

    connection.once('error', error => {
      if (error) {
        console.error(error);
      }

      emittersMap[uri]?.emit(
        errorEventName,
        new Error('Could not connect to MongoDB')
      );
      delete emittersMap[uri];
    });
  });
}
