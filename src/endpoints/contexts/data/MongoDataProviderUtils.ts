import {ClientSession} from 'mongoose';
import {
  isMongoClientSession,
  isMongoConnection,
} from '../../../db/connection.js';
import {appAssert} from '../../../utils/assertion.js';
import {AnyFn} from '../../../utils/types.js';
import {kAsyncLocalStorageKeys} from '../asyncLocalStorage.js';
import {kUtilsInjectables} from '../injection/injectables.js';
import {DataProviderUtils} from './types.js';

export class MongoDataProviderUtils implements DataProviderUtils {
  async withTxn<TResult>(
    fn: AnyFn<[txn: ClientSession], Promise<TResult>>,
    existingSession?: unknown
  ): Promise<TResult> {
    let result: TResult | undefined = undefined;

    if (existingSession) {
      appAssert(isMongoClientSession(existingSession));
      result = await fn(existingSession);
    } else {
      const connection = kUtilsInjectables.dbConnection().get();
      appAssert(isMongoConnection(connection));
      const session = await connection.startSession();
      await session.withTransaction(async () =>
        kUtilsInjectables
          .asyncLocalStorage()
          .shadowSetForce(
            kAsyncLocalStorageKeys.txn,
            session,
            async () => (result = await fn(session))
          )
      );
      await session.endSession();
    }

    // `connection.transaction` throws if error occurs so if the control flow
    // gets here, `result` is set.
    return result as unknown as TResult;
  }
}
