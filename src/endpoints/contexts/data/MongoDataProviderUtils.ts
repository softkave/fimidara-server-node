import {ClientSession} from 'mongoose';
import {isMongoConnection} from '../../../db/connection';
import {appAssert} from '../../../utils/assertion';
import {AnyFn} from '../../../utils/types';
import {kAsyncLocalStorageKeys} from '../asyncLocalStorage';
import {kUtilsInjectables} from '../injection/injectables';
import {DataProviderUtils} from './types';

export class MongoDataProviderUtils implements DataProviderUtils {
  async withTxn<TResult>(
    fn: AnyFn<[txn: ClientSession], Promise<TResult>>,
    reuseAsyncLocalTxn: boolean = true
  ): Promise<TResult> {
    const connection = kUtilsInjectables.dbConnection().get();
    appAssert(isMongoConnection(connection));
    const existingSession = kUtilsInjectables
      .asyncLocalStorage()
      .get<ClientSession>(kAsyncLocalStorageKeys.txn);
    let result: TResult | undefined = undefined;
    appAssert(connection);

    if (reuseAsyncLocalTxn && existingSession && existingSession.transaction.isActive) {
      result = await fn(existingSession);
    } else {
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
