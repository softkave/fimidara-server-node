import {NotFoundError, ResourceExistsError} from '../endpoints/errors';
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
    withRootnameNotFound: (rootname: string) => not_implemented,
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
    invalidMatcher: () => not_implemented,
    provideNamepath: () => not_implemented,
    unknownBackend: (backend: string) => not_implemented,
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
    mountExists: () => not_implemented,
    mountNameExists: (name: string) => not_implemented,
    s3MountSourceMissingBucket: () => not_implemented,
    notFound: () => not_implemented,
  },
  config: {
    configNameExists: (name: string) => not_implemented,
    configInUse: (mountsCount: number) => not_implemented,
    notFound: () => not_implemented,
    configExists: () => not_implemented,
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
