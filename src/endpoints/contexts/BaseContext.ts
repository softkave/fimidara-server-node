import {Logger} from 'winston';
import {FileBackendType, IAppVariables} from '../../resources/vars';
import {waitTimeout} from '../../utils/fns';
import {consoleLogger, logger} from '../../utils/logger/logger';
import {FimidaraLoggerServiceNames, loggerFactory} from '../../utils/logger/loggerUtils';
import {logRejectedPromisesAndThrow} from '../../utils/waitOnPromises';
import {IEmailProviderContext} from './EmailProviderContext';
import {IFilePersistenceProviderContext, S3FilePersistenceProviderContext} from './FilePersistenceProviderContext';
import MemoryFilePersistenceProviderContext from './MemoryFilePersistenceProviderContext';
import SessionContext, {ISessionContext} from './SessionContext';
import {IBaseContext, IBaseContextDataProviders} from './types';
import {UsageRecordLogicProvider} from './UsageRecordLogicProvider';

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
  session: ISessionContext = new SessionContext();
  logger: Logger = logger;
  clientLogger: Logger = loggerFactory({
    transports: ['mongodb'],
    meta: {service: FimidaraLoggerServiceNames.WebClient},
  });
  usageRecord: UsageRecordLogicProvider;
  disposeFn?: () => Promise<void>;

  constructor(data: T, emailProvider: E, fileBackend: F, appVariables: V, disposeFn?: () => Promise<void>) {
    this.data = data;
    this.email = emailProvider;
    this.fileBackend = fileBackend;
    this.usageRecord = new UsageRecordLogicProvider();
    this.appVariables = appVariables;
    this.disposeFn = disposeFn;
  }

  init = async () => {};

  dispose = async () => {
    const promises = [this.fileBackend.close(), this.email.close()];
    logRejectedPromisesAndThrow(this, await Promise.allSettled(promises));
    this.logger.close();
    this.clientLogger.close();
    consoleLogger.close();
    if (this.disposeFn) {
      await this.disposeFn();
    }
    await waitTimeout(5000);
  };
}

export function getFileProvider(appVariables: IAppVariables) {
  if (appVariables.fileBackend === FileBackendType.S3) {
    return new S3FilePersistenceProviderContext(appVariables.awsRegion);
  } else {
    return new MemoryFilePersistenceProviderContext();
  }
}
