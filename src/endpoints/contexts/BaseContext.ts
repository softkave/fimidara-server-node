import {map} from 'lodash';
import {Connection as MongoConnection} from 'mongoose';
import {AppMongoModels} from '../../db/types';
import {FilePersistenceType, FimidaraConfig} from '../../resources/types';
import {appAssert} from '../../utils/assertion';
import {logRejectedPromisesAndThrow} from '../../utils/waitOnPromises';
import SessionContext, {SessionContextType} from './SessionContext';
import {SESEmailProviderContext} from './email/SESEmailProviderContext';
import {IEmailProviderContext} from './email/types';
import LocalFsFilePersistenceProvider from './file/LocalFsFilePersistenceProvider';
import MemoryFilePersistenceProvider from './file/MemoryFilePersistenceProvider';
import {S3FilePersistenceProvider} from './file/S3FilePersistenceProvider';
import {FilePersistenceProvider} from './file/types';
import {
  BaseContextDataProviders,
  BaseContextLogicProviders,
  BaseContextSemanticDataProviders,
  BaseContextType,
} from './types';

export default class BaseContext<
  Data extends BaseContextDataProviders = BaseContextDataProviders,
  SemanticData extends BaseContextSemanticDataProviders = BaseContextSemanticDataProviders,
  Email extends IEmailProviderContext = IEmailProviderContext,
  FileBackend extends FilePersistenceProvider = FilePersistenceProvider,
  AppVars extends FimidaraConfig = FimidaraConfig,
  Logic extends BaseContextLogicProviders = BaseContextLogicProviders
> implements BaseContextType<Data, SemanticData, Email, FileBackend, AppVars, Logic>
{
  data: Data;
  email: Email;
  fileBackend: FileBackend;
  appVariables: AppVars;
  logic: Logic;
  semantic: SemanticData;
  session: SessionContextType = new SessionContext();
  mongoConnection: MongoConnection | null = null;
  mongoModels: AppMongoModels | null = null;
  disposeFn?: () => Promise<void>;

  constructor(
    data: Data,
    emailProvider: Email,
    fileBackend: FileBackend,
    appVariables: AppVars,
    logic: Logic,
    semantic: SemanticData,
    mongoConnection: MongoConnection | null,
    mongoModels: AppMongoModels | null,
    disposeFn?: () => Promise<void>
  ) {
    this.data = data;
    this.email = emailProvider;
    this.fileBackend = fileBackend;
    this.appVariables = appVariables;
    this.logic = logic;
    this.semantic = semantic;
    this.disposeFn = disposeFn;
    this.mongoConnection = mongoConnection;
    this.mongoModels = mongoModels;
  }

  init = async () => {
    if (this.mongoModels) {
      await Promise.all(
        map(this.mongoModels, async model => {
          const existingCollections = await model.db.db.listCollections().toArray();

          if (
            existingCollections.find(
              collection => collection.name === model.collection.collectionName
            )
          ) {
            return;
          }

          console.log(`creating ${model.collection.collectionName} mongodb model`);
          return model.createCollection();
        })
      );
    }
  };

  dispose = async () => {
    const promises = [this.fileBackend.close(), this.email.close()];
    logRejectedPromisesAndThrow(await Promise.allSettled(promises));

    if (this.disposeFn) {
      await this.disposeFn();
    }
  };
}

export function getFileProvider(appVariables: FimidaraConfig) {
  if (appVariables.fileBackend === FilePersistenceType.S3) {
    return new S3FilePersistenceProvider(appVariables.awsRegion);
  } else if (appVariables.fileBackend === FilePersistenceType.Memory) {
    return new MemoryFilePersistenceProvider();
  } else if (appVariables.fileBackend === FilePersistenceType.LocalFs) {
    appAssert(appVariables.localFsDir);
    return new LocalFsFilePersistenceProvider(appVariables.localFsDir);
  }

  throw new Error(`Invalid file backend type ${appVariables.fileBackend}.`);
}

export function getEmailProvider(appVariables: FimidaraConfig) {
  return new SESEmailProviderContext(appVariables.awsRegion);
}
