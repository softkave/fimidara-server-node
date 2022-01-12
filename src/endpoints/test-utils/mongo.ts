import {getMongoConnection} from '../../db/connection';
import {getTestVars} from './vars';

export async function getTestMongoConnection() {
  const connection = await getMongoConnection(getTestVars().mongoDbURI);
  return connection;
}
