import {faker} from '@faker-js/faker';
import {map} from 'lodash';
import {Connection} from 'mongoose';
import {waitOnPromisesAndLogErrors} from '../../../utilities/promiseFns';

export async function dropMongoConnection(connection?: Connection | null) {
  if (!connection) {
    return;
  }

  const collections = await connection.db.collections();
  const promises = map(collections, collection => {
    return collection.drop();
  });

  await waitOnPromisesAndLogErrors(promises);
  await connection.db.dropDatabase();
  await connection.close();
}

export function genDbName() {
  return faker.lorem.words(5).replace(/ /g, '_');
}
