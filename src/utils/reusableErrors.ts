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
  clientToken: {
    notFound(id?: string) {
      return new NotFoundError(appMessages.clientToken.notFound(id));
    },
  },
  programToken: {
    notFound(id?: string) {
      return new NotFoundError(appMessages.programToken.notFound(id));
    },
  },
  permissionGroup: {
    notFound(id?: string) {
      return new NotFoundError(appMessages.permissionGroup.notFound(id));
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
};
