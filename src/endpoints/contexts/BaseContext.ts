import {Logger} from 'winston';
import {FileBackendType, IAppVariables} from '../../resources/vars';
import {waitTimeout} from '../../utils/fns';
import {consoleLogger, logger} from '../../utils/logger/logger';
import {FimidaraLoggerServiceNames, loggerFactory} from '../../utils/logger/loggerUtils';
import {logRejectedPromisesAndThrow} from '../../utils/waitOnPromises';
import {IEmailProviderContext} from './EmailProviderContext';
import {
  IFilePersistenceProviderContext,
  S3FilePersistenceProviderContext,
} from './FilePersistenceProviderContext';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import MemoryFilePersistenceProviderContext from './MemoryFilePersistenceProviderContext';
import SessionContext, {ISessionContext} from './SessionContext';
import {
  IBaseContext,
  IBaseContextDataProviders,
  IBaseContextLogicProviders,
  IBaseContextMemoryCacheProviders,
  IBaseContextSemanticDataProviders,
} from './types';

export default class BaseContext<
  Data extends IBaseContextDataProviders = IBaseContextDataProviders,
  Email extends IEmailProviderContext = IEmailProviderContext,
  FileBackend extends IFilePersistenceProviderContext = IFilePersistenceProviderContext,
  AppVars extends IAppVariables = IAppVariables,
  MemoryCache extends IBaseContextMemoryCacheProviders = IBaseContextMemoryCacheProviders,
  Logic extends IBaseContextLogicProviders = IBaseContextLogicProviders,
  SemanticData extends IBaseContextSemanticDataProviders = IBaseContextSemanticDataProviders
> implements IBaseContext<Data, Email, FileBackend, AppVars, MemoryCache, Logic, SemanticData>
{
  data: Data;
  email: Email;
  fileBackend: FileBackend;
  appVariables: AppVars;
  memory: MemoryCache;
  logic: Logic;
  semantic: SemanticData;
  session: ISessionContext = new SessionContext();
  logger: Logger = logger;
  clientLogger: Logger = loggerFactory({
    transports: ['mongodb'],
    meta: {service: FimidaraLoggerServiceNames.WebClient},
  });
  usageRecord: UsageRecordLogicProvider;
  disposeFn?: () => Promise<void>;

  constructor(
    data: Data,
    emailProvider: Email,
    fileBackend: FileBackend,
    appVariables: AppVars,
    memory: MemoryCache,
    logic: Logic,
    semantic: SemanticData,
    disposeFn?: () => Promise<void>
  ) {
    this.data = data;
    this.email = emailProvider;
    this.fileBackend = fileBackend;
    this.usageRecord = new UsageRecordLogicProvider();
    this.appVariables = appVariables;
    this.memory = memory;
    this.logic = logic;
    this.semantic = semantic;
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
