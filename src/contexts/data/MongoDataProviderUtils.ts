import {ClientSession} from 'mongoose';
import {isMongoClientSession, isMongoConnection} from '../../db/connection.js';
import {appAssert} from '../../utils/assertion.js';
import {AnyFn} from '../../utils/types.js';
import {kUtilsInjectables} from '../injection/injectables.js';
import {DataProviderUtils} from './types.js';

export class MongoDataProviderUtils implements DataProviderUtils {
  async withTxn<TResult>(
    fn: AnyFn<[txn: ClientSession], Promise<TResult>>,
    existingSession?: unknown
  ): Promise<TResult> {
    if (existingSession) {
      appAssert(isMongoClientSession(existingSession));
      return await fn(existingSession);
    } else {
      const connection = kUtilsInjectables.dbConnection().get();
      appAssert(isMongoConnection(connection));
      const session = await connection.startSession();

      try {
        return await session.withTransaction(fn);
      } finally {
        await session.endSession();
      }
    }
  }
}
