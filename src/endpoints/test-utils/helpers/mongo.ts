import {faker} from '@faker-js/faker';
import {Connection} from 'mongoose';

export async function dropMongoConnection(connection?: Connection | null) {
  if (!connection) {
    return;
  }

  await connection.dropDatabase();
  await connection.close();

  // const collections = await connection.db.collections();
  // const promises = map(collections, collection => {
  //   return collection.drop();
  // });

  // await waitOnPromisesAndLogErrors(promises);
  // await connection.db.dropDatabase();
  // await connection.close();
}

export function genDbName() {
  return faker.lorem.words(5).replace(/ /g, '_');
}
