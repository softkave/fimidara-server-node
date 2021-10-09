import {createConnection, Connection} from 'mongoose';
import {appVariables} from '../resources/appVariables';

let connection: Connection | null = null;

export function getMongoConnection(): Promise<Connection> {
  return new Promise((resolve, reject) => {
    if (connection) {
      resolve(connection);
    }

    if (!appVariables.mongoDbURI) {
      reject(new Error('Mongodb URI not provided'));
      return;
    }

    connection = createConnection(appVariables.mongoDbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    connection.once('open', () => {
      resolve(connection!);
    });

    connection.once('error', error => {
      if (error) {
        console.error(error);
      }

      reject(new Error("Couldn't connect to Mongodb"));
    });
  });
}
