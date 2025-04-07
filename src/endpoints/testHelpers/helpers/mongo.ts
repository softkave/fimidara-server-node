import {faker} from '@faker-js/faker';
import {Connection} from 'mongoose';

export async function dropMongoDBAndEndConnection(connection?: Connection | null) {
  if (!connection) {
    return;
  }

  await connection.dropDatabase();
  await connection.close();
}

export function genDbName() {
  return faker.lorem.words(5).replace(/ /g, '_');
}
