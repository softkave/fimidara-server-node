import {
  InvalidRequestError,
  NotFoundError,
  ResourceExistsError,
  ResourceInUseError,
} from '../endpoints/errors';
import {
  BackendUnknownError,
  FimidaraDoesNotSupportConfigError,
  FimidaraNotAllowedError,
  MountSourceMissingBucketError,
} from '../endpoints/fileBackends/errors';
import {InvalidMatcherError, ProvideNamepathError} from '../endpoints/files/errors';
import {
  ChangePasswordError,
  InvalidCredentialsError,
  UserOnWaitlistError,
} from '../endpoints/users/errors';
import {kAppMessages} from './messages';

export const kReuseableErrors = {
  workspace: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.workspace.notFound(id));
    },
    withRootnameNotFound(rootname: string) {
      return new NotFoundError(kAppMessages.workspace.withRootnameNotFound(rootname));
    },
  },
  entity: {
    notFound(id: string) {
      return new NotFoundError(kAppMessages.entity.notFound(id));
    },
  },
  user: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.user.notFound(id));
    },
    changePassword() {
      return new ChangePasswordError();
    },
    userOnWaitlist() {
      return new UserOnWaitlistError();
    },
  },
  permissionGroup: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.permissionGroup.notFound(id));
    },
  },
  permissionItem: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.permissionItem.notFound(id));
    },
  },
  credentials: {
    invalidCredentials() {
      return new InvalidCredentialsError();
    },
  },
  collaborationRequest: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.collaborationRequest.notFound(id));
    },
  },
  folder: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.folder.notFound(id));
    },
  },
  tag: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.tag.notFound(id));
    },
  },
  usageRecord: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.usageRecord.notFound(id));
    },
  },
  file: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.file.notFound(id));
    },
    invalidMatcher() {
      return new InvalidMatcherError(kAppMessages.file.invalidMatcher);
    },
    provideNamepath() {
      return new ProvideNamepathError(kAppMessages.file.provideNamepath);
    },
    unknownBackend(backend: string) {
      return new BackendUnknownError(kAppMessages.file.unknownBackend(backend));
    },
  },
  appRuntimeState: {
    notFound() {
      return new NotFoundError(kAppMessages.appRuntimeState.notFound());
    },
  },
  agentToken: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.agentToken.notFound(id));
    },
    withIdExists(id?: string) {
      return new ResourceExistsError(kAppMessages.agentToken.withIdExists(id));
    },
    withProvidedIdExists(id?: string) {
      return new ResourceExistsError(kAppMessages.agentToken.withProvidedIdExists(id));
    },
  },
  mount: {
    mountExists() {
      return new NotFoundError(kAppMessages.mount.mountExists);
    },
    mountNameExists(name: string) {
      return new ResourceExistsError(kAppMessages.mount.mountNameExists(name));
    },
    s3MountSourceMissingBucket() {
      return new MountSourceMissingBucketError(
        kAppMessages.mount.s3MountSourceMissingBucket
      );
    },
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.mount.notFound(id));
    },
    cannotMountFimidaraExplicitly() {
      return new FimidaraNotAllowedError(
        kAppMessages.mount.cannotMountFimidaraExplicitly
      );
    },
    cannotDeleteFimidaraMount() {
      return new FimidaraNotAllowedError(kAppMessages.mount.cannotDeleteFimidaraMount);
    },
    cannotUpdateFimidaraMount() {
      return new FimidaraNotAllowedError(kAppMessages.mount.cannotUpdateFimidaraMount);
    },
    configMountBackendMismatch: (configBackend: string, mountBackend: string) =>
      new InvalidRequestError(
        kAppMessages.mount.configMountBackendMismatch(configBackend, mountBackend)
      ),
  },
  config: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.config.notFound(id));
    },
    configInUse(mountsCount: number) {
      return new ResourceInUseError(kAppMessages.config.configInUse(mountsCount));
    },
    configExists() {
      return new ResourceExistsError(kAppMessages.config.configExists);
    },
    configNameExists(name: string) {
      return new ResourceExistsError(kAppMessages.config.configNameExists(name));
    },
    fimidaraDoesNotSupportConfig() {
      return new FimidaraDoesNotSupportConfigError(
        kAppMessages.config.fimidaraDoesNotSupportConfig
      );
    },
  },
  job: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.job.notFound(id));
    },
  },
  common: {
    notImplemented() {
      return new Error(kAppMessages.common.notImplementedYet());
    },
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.common.notFound(id));
    },
  },
};
