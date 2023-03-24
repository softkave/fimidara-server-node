import {Logger} from 'winston';
import {FileBackendType, IAppVariables} from '../../resources/vars';
import {FimidaraLoggerServiceNames, loggerFactory} from '../../utils/logger/loggerUtils';
import {logRejectedPromisesAndThrow} from '../../utils/waitOnPromises';
import {IEmailProviderContext} from './EmailProviderContext';
import {
  IFilePersistenceProviderContext,
  S3FilePersistenceProviderContext,
} from './FilePersistenceProviderContext';
import MemoryFilePersistenceProviderContext from './MemoryFilePersistenceProviderContext';
import SessionContext, {ISessionContext} from './SessionContext';
import {
  IBaseContext,
  IBaseContextDataProviders,
  IBaseContextLogicProviders,
  IBaseContextMemStoreProviders,
  IBaseContextSemanticDataProviders,
} from './types';

export default class BaseContext<
  Data extends IBaseContextDataProviders = IBaseContextDataProviders,
  Email extends IEmailProviderContext = IEmailProviderContext,
  FileBackend extends IFilePersistenceProviderContext = IFilePersistenceProviderContext,
  AppVars extends IAppVariables = IAppVariables,
  MemStore extends IBaseContextMemStoreProviders = IBaseContextMemStoreProviders,
  Logic extends IBaseContextLogicProviders = IBaseContextLogicProviders,
  SemanticData extends IBaseContextSemanticDataProviders = IBaseContextSemanticDataProviders
> implements IBaseContext<Data, Email, FileBackend, AppVars, MemStore, Logic, SemanticData>
{
  data: Data;
  email: Email;
  fileBackend: FileBackend;
  appVariables: AppVars;
  memstore: MemStore;
  logic: Logic;
  semantic: SemanticData;
  session: ISessionContext = new SessionContext();
  clientLogger: Logger = loggerFactory({
    transports: ['mongodb'],
    meta: {service: FimidaraLoggerServiceNames.WebClient},
  });
  disposeFn?: () => Promise<void>;

  constructor(
    data: Data,
    emailProvider: Email,
    fileBackend: FileBackend,
    appVariables: AppVars,
    memory: MemStore,
    logic: Logic,
    semantic: SemanticData,
    disposeFn?: () => Promise<void>
  ) {
    this.data = data;
    this.email = emailProvider;
    this.fileBackend = fileBackend;
    this.appVariables = appVariables;
    this.memstore = memory;
    this.logic = logic;
    this.semantic = semantic;
    this.disposeFn = disposeFn;
  }

  init = async () => {};

  dispose = async () => {
    const promises = [this.fileBackend.close(), this.email.close()];
    logRejectedPromisesAndThrow(await Promise.allSettled(promises));
    this.clientLogger.close();
    if (this.disposeFn) {
      await this.disposeFn();
    }
  };
}

export function getFileProvider(appVariables: IAppVariables) {
  if (appVariables.fileBackend === FileBackendType.S3) {
    return new S3FilePersistenceProviderContext(appVariables.awsRegion);
  } else {
    return new MemoryFilePersistenceProviderContext();
  }
}
