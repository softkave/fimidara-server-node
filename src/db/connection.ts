import {createConnection, Connection} from 'mongoose';

export function getMongoConnection(uri: string): Promise<Connection> {
  const connection = createConnection(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

  return new Promise((resolve, reject) => {
    connection?.once('open', () => resolve(connection));
    connection?.once('error', reject);
  });
}
