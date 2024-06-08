import {ClientSession, Connection, createConnection} from 'mongoose';
import {noopAsync} from '../utils/fns.js';

export function getMongoConnection(uri: string, dbName: string) {
  const connection = createConnection(uri, {dbName});
  const promise = connection.asPromise();
  return {connection, promise};
}

export interface DbConnection<T = unknown> {
  get: <TConnection = T>() => TConnection;
  wait: <TConnection = T>() => Promise<TConnection>;
  close: () => Promise<void>;
}

export class MongoDbConnection implements DbConnection<Connection> {
  protected connection: Connection;
  protected promise: Promise<Connection>;

  constructor(uri: string, dbName: string) {
    const {connection, promise} = getMongoConnection(uri, dbName);
    this.connection = connection;
    this.promise = promise;
  }

  get = <TConnection = Connection>() => {
    return this.connection as TConnection;
  };

  wait = <TConnection = Connection>() => {
    return this.promise as TConnection;
  };

  close = async () => {
    await this.connection.close();
  };
}

export function isMongoConnection(
  connection: unknown
): connection is Connection {
  // Not an exhaustive check, but useful enough
  return !!(connection as Connection).collections;
}

export function isMongoClientSession(
  session: unknown
): session is ClientSession {
  return !!(session as ClientSession)?.toBSON;
}

export class NoopDbConnection implements DbConnection<undefined> {
  get = <TConnection = undefined>() => {
    return undefined as TConnection;
  };

  wait = <TConnection = undefined>() => {
    return undefined as TConnection;
  };

  close = noopAsync;
}
