import {Connection} from 'mongoose';
import * as _ from 'lodash';
import {waitOnPromisesAndLogErrors} from '../../../utilities/promiseFns';

export async function dropMongoConnection(connection: Connection) {
  console.log(
    `-- Mongo - dropping mongo collections in db ${connection.db.databaseName} --`
  );
  const collections = await connection.db.collections();
  const promises = _.map(collections, collection => {
    return collection.drop();
  });

  await waitOnPromisesAndLogErrors(promises);
  await connection.close();
}
