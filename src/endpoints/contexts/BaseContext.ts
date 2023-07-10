import {forEach} from 'lodash';
import {Connection as MongoConnection} from 'mongoose';
import {FileBackendType, FimidaraConfig} from '../../resources/types';
import {appAssert} from '../../utils/assertion';
import {logRejectedPromisesAndThrow} from '../../utils/waitOnPromises';
import SessionContext, {SessionContextType} from './SessionContext';
import {SESEmailProviderContext} from './email/SESEmailProviderContext';
import {IEmailProviderContext} from './email/types';
import LocalFsFilePersistenceProviderContext from './file/LocalFsFilePersistenceProviderContext';
import MemoryFilePersistenceProviderContext from './file/MemoryFilePersistenceProviderContext';
import {S3FilePersistenceProviderContext} from './file/S3FilePersistenceProviderContext';
import {FilePersistenceProviderContext} from './file/types';
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
  AppVars extends FimidaraConfig = FimidaraConfig,
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
  session: SessionContextType = new SessionContext();
  mongoConnection: MongoConnection | null = null;
  disposeFn?: () => Promise<void>;

  constructor(
    data: Data,
    emailProvider: Email,
    fileBackend: FileBackend,
    appVariables: AppVars,
    memory: MemStore,
    logic: Logic,
    semantic: SemanticData,
    mongoConnection: MongoConnection | null,
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
    this.mongoConnection = mongoConnection;
  }

  init = async () => {};

  dispose = async () => {
    forEach(this.memstore, store => {
      (store as MemStoreType<any>).dispose();
    });

    const promises = [this.fileBackend.close(), this.email.close()];
    logRejectedPromisesAndThrow(await Promise.allSettled(promises));

    if (this.disposeFn) {
      await this.disposeFn();
    }
  };
}

export function getFileProvider(appVariables: FimidaraConfig) {
  if (appVariables.fileBackend === FileBackendType.S3) {
    return new S3FilePersistenceProviderContext(appVariables.awsRegion);
  } else if (appVariables.fileBackend === FileBackendType.Memory) {
    return new MemoryFilePersistenceProviderContext();
  } else if (appVariables.fileBackend === FileBackendType.LocalFs) {
    appAssert(appVariables.localFsDir);
    return new LocalFsFilePersistenceProviderContext(appVariables.localFsDir);
  }

  throw new Error(`Invalid file backend type ${appVariables.fileBackend}.`);
}

export function getEmailProvider(appVariables: FimidaraConfig) {
  return new SESEmailProviderContext(appVariables.awsRegion);
}
