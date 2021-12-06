import {createConnection, Connection} from 'mongoose';
import {appVariables} from '../resources/appVariables';

let connection: Connection | null = null;

export function getMongoConnection(): Promise<Connection> {
  return new Promise((resolve, reject) => {
    if (connection) {
      resolve(connection);
    }

    if (!appVariables.mongoDbURI) {
      reject(new Error('MongoDB URI not provided'));
      return;
    }

    connection = createConnection(appVariables.mongoDbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    connection.once('open', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      resolve(connection!);
    });

    connection.once('error', error => {
      if (error) {
        console.error(error);
      }

      reject(new Error('Could not connect to MongoDB'));
    });
  });
}
