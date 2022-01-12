import {getMongoConnection} from '../../db/connection';

export async function getTestMongoConnection() {
  throw new Error('Mongo URI not set');
  const connection = await getMongoConnection('mongo uri');
  return connection;
}
