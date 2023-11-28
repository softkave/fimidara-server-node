import {container} from 'tsyringe';
import {FileBackendProductType} from '../../../definitions/fileBackend';
import {FimidaraConfig} from '../../../resources/types';
import {kInjectionKeys} from '../injection';
import {
  S3FilePersistenceProvider,
  S3FilePersistenceProviderInitParams,
} from './S3FilePersistenceProvider';
import {FilePersistenceProvider} from './types';

export function resolveFimidaraFilePersistenceProvider(): FilePersistenceProvider {
  const config = container.resolve<FimidaraConfig>(kInjectionKeys.config);

  if (config.fileBackend === 'fimidara') {
    throw new Error('Restart the server with a different provider besides fimidara');
  }

  switch (config.fileBackend) {
    case 'aws-s3':
      return new S3FilePersistenceProvider(config.awsConfig);
  }
}

export function resolveFilePersistenceProvider(
  type: FileBackendProductType,
  initParams: unknown
): FilePersistenceProvider {
  if (type === 'fimidara') {
    return resolveFimidaraFilePersistenceProvider();
  } else if (type === 'aws-s3') {
    return new S3FilePersistenceProvider(
      initParams as S3FilePersistenceProviderInitParams
    );
  }

  throw new Error(`Unknown FileBackendProvider ${type}`);
}
