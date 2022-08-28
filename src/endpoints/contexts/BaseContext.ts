import {Connection} from 'mongoose';
import {Logger} from 'winston';
import {FileBackendType, IAppVariables} from '../../resources/vars';
import {consoleLogger, logger} from '../../utilities/logger/logger';
import {disposeDbTransport} from '../../utilities/logger/loggerUtils';
import {throwRejectedPromisesWithStatus} from '../../utilities/waitOnPromises';
import {ContextPendingJobs, IContextPendingJobs} from './ContextPendingJobs';
import {UsageRecordMongoDataProvider} from './data-providers/UsageRecordDataProvider';
import {UsageRecordLogicProvider} from './data-providers/UsageRecordLogicProvider';
import {WorkspaceCacheProvider} from './data-providers/WorkspaceCacheProvider';
import {WorkspaceMongoDataProvider} from './data-providers/WorkspaceDataProvider';
import {IEmailProviderContext} from './EmailProviderContext';
import {
  IFilePersistenceProviderContext,
  S3FilePersistenceProviderContext,
} from './FilePersistenceProviderContext';
import MemoryFilePersistenceProviderContext from './MemoryFilePersistenceProviderContext';
import SessionContext, {ISessionContext} from './SessionContext';
import {IBaseContext, IBaseContextDataProviders} from './types';

export default class BaseContext<
  T extends IBaseContextDataProviders,
  E extends IEmailProviderContext,
  F extends IFilePersistenceProviderContext,
  V extends IAppVariables
> implements IBaseContext<T>
{
  data: T;
  email: E;
  fileBackend: F;
  appVariables: V;
  dataProviders: IBaseContext['dataProviders'];
  cacheProviders: IBaseContext['cacheProviders'];
  logicProviders: IBaseContext['logicProviders'];
  session: ISessionContext = new SessionContext();
  jobs: IContextPendingJobs;
  logger: Logger = logger;
  disposeFn?: () => Promise<void>;

  constructor(
    data: T,
    emailProvider: E,
    fileBackend: F,
    appVariables: V,
    dataProviders: IBaseContext['dataProviders'],
    cacheProviders: IBaseContext['cacheProviders'],
    logicProviders: IBaseContext['logicProviders'],
    disposeFn?: () => Promise<void>
  ) {
    this.data = data;
    this.email = emailProvider;
    this.fileBackend = fileBackend;
    this.appVariables = appVariables;
    this.dataProviders = dataProviders;
    this.cacheProviders = cacheProviders;
    this.logicProviders = logicProviders;
    this.disposeFn = disposeFn;
    this.jobs = new ContextPendingJobs(this.appVariables.nodeEnv !== 'test');
  }

  init = async () => {
    await this.cacheProviders.workspace.init(this);
  };

  dispose = async () => {
    await this.jobs.waitOnJobs(this);
    const promises = [
      this.cacheProviders.workspace.dispose(),
      this.fileBackend.close(),
      this.email.close(),
      this.data.close(),
    ];

    if (this.disposeFn) {
      promises.push(this.disposeFn());
    }

    throwRejectedPromisesWithStatus(this, await Promise.allSettled(promises));
    await Promise.all([
      this.logger.close(),
      consoleLogger.close(),
      disposeDbTransport(),
    ]);
  };
}

export function getDataProviders(
  connection: Connection
): IBaseContext['dataProviders'] {
  return {
    usageRecord: new UsageRecordMongoDataProvider(connection),
    workspace: new WorkspaceMongoDataProvider(connection),
  };
}

export function getCacheProviders(): IBaseContext['cacheProviders'] {
  return {
    workspace: new WorkspaceCacheProvider(),
  };
}

export function getLogicProviders(): IBaseContext['logicProviders'] {
  return {
    usageRecord: new UsageRecordLogicProvider(),
  };
}

export function getFileProvider(appVariables: IAppVariables) {
  if (appVariables.fileBackend === FileBackendType.S3) {
    return new S3FilePersistenceProviderContext(appVariables.awsRegion);
  } else {
    return new MemoryFilePersistenceProviderContext();
  }
}
