import {createConnection} from 'mongoose';

export function getMongoConnection(uri: string, dbName: string) {
  const connection = createConnection(uri, {dbName});
  const promise = new Promise((resolve, reject) => {
    connection?.once('open', () => resolve(connection));
    connection?.once('error', reject);
  });

  return {connection, promise};
}
