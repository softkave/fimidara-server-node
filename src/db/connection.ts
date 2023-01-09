import {Connection, createConnection} from 'mongoose';

export function getMongoConnection(uri: string, dbName: string): Promise<Connection> {
  const connection = createConnection(uri, {dbName});
  return new Promise((resolve, reject) => {
    connection?.once('open', () => resolve(connection));
    connection?.once('error', reject);
  });
}
