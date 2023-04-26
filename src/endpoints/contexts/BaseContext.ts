import {forEach} from 'lodash';
import {Logger} from 'winston';
import {AppVariables, FileBackendType} from '../../resources/vars';
import {FimidaraLoggerServiceNames, loggerFactory} from '../../utils/logger/loggerUtils';
import {logRejectedPromisesAndThrow} from '../../utils/waitOnPromises';
import {IEmailProviderContext} from './EmailProviderContext';
import {
  FilePersistenceProviderContext,
  S3FilePersistenceProviderContext,
} from './FilePersistenceProviderContext';
import MemoryFilePersistenceProviderContext from './MemoryFilePersistenceProviderContext';
import SessionContext from './SessionContext';
import {MemStoreType} from './mem/types';
import {
  BaseContextDataProviders,
  BaseContextLogicProviders,
  BaseContextMemStoreProviders,
  BaseContextSemanticDataProviders,
  BaseContextType,
} from './types';

export default class BaseContext<
  Data extends BaseContextDataProviders = BaseContextDataProviders,
  Email extends IEmailProviderContext = IEmailProviderContext,
  FileBackend extends FilePersistenceProviderContext = FilePersistenceProviderContext,
  AppVars extends AppVariables = AppVariables,
  MemStore extends BaseContextMemStoreProviders = BaseContextMemStoreProviders,
  Logic extends BaseContextLogicProviders = BaseContextLogicProviders,
  SemanticData extends BaseContextSemanticDataProviders = BaseContextSemanticDataProviders
> implements BaseContextType<Data, Email, FileBackend, AppVars, MemStore, Logic, SemanticData>
{
  data: Data;
  email: Email;
  fileBackend: FileBackend;
  appVariables: AppVars;
  memstore: MemStore;
  logic: Logic;
  semantic: SemanticData;
  session: SessionContext = new SessionContext();
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
    forEach(this.memstore, store => {
      (store as MemStoreType<any>).dispose();
    });

    const promises = [this.fileBackend.close(), this.email.close()];
    logRejectedPromisesAndThrow(await Promise.allSettled(promises));
    this.clientLogger.close();

    if (this.disposeFn) {
      await this.disposeFn();
    }
  };
}

export function getFileProvider(appVariables: AppVariables) {
  if (appVariables.fileBackend === FileBackendType.S3) {
    return new S3FilePersistenceProviderContext(appVariables.awsRegion);
  } else {
    return new MemoryFilePersistenceProviderContext();
  }
}
