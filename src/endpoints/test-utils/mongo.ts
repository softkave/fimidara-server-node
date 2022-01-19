import {getMongoConnection} from '../../db/connection';
import {getTestVars} from './vars';

export async function getTestMongoConnection() {
  return await getMongoConnection(getTestVars().mongoDbURI);
}
