import {NotFoundError} from '../endpoints/errors';
import {InvalidCredentialsError} from '../endpoints/user/errors';
import {appMessages} from './messages';

export const reuseableErrors = {
  entity: {
    notFound(id: string) {
      return new NotFoundError(appMessages.entity.notFound(id));
    },
  },
  user: {
    notFound(id?: string) {
      return new NotFoundError(appMessages.user.notFound(id));
    },
  },
  permissionGroup: {
    notFound(id?: string) {
      return new NotFoundError(appMessages.permissionGroup.notFound(id));
    },
  },
  permissionItem: {
    notFound(id?: string) {
      return new NotFoundError(appMessages.permissionItem.notFound(id));
    },
  },
  credentials: {
    invalidCredentials() {
      return new InvalidCredentialsError();
    },
  },
  collaborationRequest: {
    notFound(id?: string) {
      return new NotFoundError(appMessages.collaborationRequest.notFound(id));
    },
  },
  folder: {
    notFound(id?: string) {
      return new NotFoundError(appMessages.folder.notFound(id));
    },
  },
  tag: {
    notFound(id?: string) {
      return new NotFoundError(appMessages.tag.notFound(id));
    },
  },
  usageRecord: {
    notFound(id?: string) {
      return new NotFoundError(appMessages.usageRecord.notFound(id));
    },
  },
  file: {
    notFound(id?: string) {
      return new NotFoundError(appMessages.file.notFound(id));
    },
  },
  appRuntimeState: {
    notFound() {
      return new NotFoundError(appMessages.appRuntimeState.notFound());
    },
  },
  agentToken: {
    notFound(id?: string) {
      return new NotFoundError(appMessages.agentToken.notFound(id));
    },
  },
  common: {
    notImplemented() {
      return new Error(appMessages.common.notImplementedYet());
    },
    notFound(id?: string) {
      return new NotFoundError(appMessages.common.notFound(id));
    },
  },
};
