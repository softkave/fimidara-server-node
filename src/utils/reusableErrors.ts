import {
  InvalidRequestError,
  InvalidStateError,
  NotFoundError,
  ResourceExistsError,
} from '../endpoints/errors.js';
import {MountSourceMissingBucketError} from '../endpoints/fileBackends/errors.js';
import {
  ChangePasswordError,
  InvalidCredentialsError,
} from '../endpoints/users/errors.js';
import {kAppMessages} from './messages.js';

export const kReuseableErrors = {
  workspace: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.workspace.notFound(id));
    },
    noRootname() {
      return new InvalidRequestError(kAppMessages.workspace.noRootname());
    },
    withRootnameNotFound(rootname: string) {
      return new NotFoundError(
        kAppMessages.workspace.withRootnameNotFound(rootname)
      );
    },
    rootnameDoesNotMatchFolderRootname: (
      rootname: string,
      rootname02: string
    ) =>
      new InvalidRequestError(
        kAppMessages.workspace.rootnameDoesNotMatchFolderRootname(
          rootname,
          rootname02
        )
      ),
    workspaceExists() {
      return new ResourceExistsError(kAppMessages.workspace.workspaceExists());
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
      return new InvalidStateError(kAppMessages.user.userIsOnWaitlist());
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
    exists() {
      return new ResourceExistsError(kAppMessages.folder.exists);
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
      return new InvalidRequestError(kAppMessages.file.invalidMatcher);
    },
    provideNamepath() {
      return new InvalidRequestError(kAppMessages.file.provideNamepath);
    },
    unknownBackend(backend: string) {
      return new InvalidRequestError(kAppMessages.file.unknownBackend(backend));
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
      return new ResourceExistsError(
        kAppMessages.agentToken.withProvidedIdExists(id)
      );
    },
  },
  mount: {
    mountExists() {
      return new ResourceExistsError(kAppMessages.mount.mountExists);
    },
    mountNameExists(name?: string) {
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
      return new InvalidRequestError(
        kAppMessages.mount.cannotMountFimidaraExplicitly
      );
    },
    cannotDeleteFimidaraMount() {
      return new InvalidRequestError(
        kAppMessages.mount.cannotDeleteFimidaraMount
      );
    },
    cannotUpdateFimidaraMount() {
      return new InvalidRequestError(
        kAppMessages.mount.cannotUpdateFimidaraMount
      );
    },
    configMountBackendMismatch: (configBackend: string, mountBackend: string) =>
      new InvalidRequestError(
        kAppMessages.mount.configMountBackendMismatch(
          configBackend,
          mountBackend
        )
      ),
    exactMountConfigExists: (
      mountedFrom: string,
      folderpath: string,
      backend: string
    ) =>
      new ResourceExistsError(
        kAppMessages.mount.exactMountConfigExists(
          mountedFrom,
          folderpath,
          backend
        )
      ),
    mountsNotSetup: () =>
      new InvalidRequestError(kAppMessages.mount.mountsNotSetup),
  },
  config: {
    notFound(id?: string) {
      return new NotFoundError(kAppMessages.config.notFound(id));
    },
    configInUse(mountsCount: number) {
      return new InvalidRequestError(
        kAppMessages.config.configInUse(mountsCount)
      );
    },
    configExists() {
      return new ResourceExistsError(kAppMessages.config.configExists);
    },
    configNameExists(name: string) {
      return new ResourceExistsError(
        kAppMessages.config.configNameExists(name)
      );
    },
    fimidaraDoesNotSupportConfig() {
      return new InvalidRequestError(
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
    invalidState(state?: string) {
      return new Error(kAppMessages.common.invalidState(state));
    },
  },
  email: {
    inBlocklist() {
      return new InvalidStateError(kAppMessages.email.emailIsInBlocklist);
    },
  },
};
