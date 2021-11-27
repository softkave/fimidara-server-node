import {
  ISessionAgent,
  AppResourceType,
  BasicCRUDActions,
} from '../../definitions/system';
import {checkClientAssignedTokenAuthorizationWithTokenId} from '../clientAssignedTokens/utils';
import {checkCollaboratorAuthorizationWithCollaboratorId} from '../collaborators/utils';
import {IBaseContext} from '../contexts/BaseContext';
import {InvalidRequestError} from '../errors';
import {checkPresetPermissionsGroupAuthorizationWithId} from '../presetPermissionsGroup/utils';
import {checkProgramAccessTokenAuthorizationWithTokenId} from '../programAccessTokens/utils';

export default async function checkEntityExists(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  permissionEntityId: string,
  permissionEntityType: AppResourceType
) {
  switch (permissionEntityType) {
    case AppResourceType.ClientAssignedToken: {
      await checkClientAssignedTokenAuthorizationWithTokenId(
        context,
        agent,
        permissionEntityId,
        BasicCRUDActions.Update
      );
      break;
    }

    case AppResourceType.ProgramAccessToken: {
      await checkProgramAccessTokenAuthorizationWithTokenId(
        context,
        agent,
        permissionEntityId,
        BasicCRUDActions.Update
      );
      break;
    }

    case AppResourceType.PresetPermissionsGroup: {
      await checkPresetPermissionsGroupAuthorizationWithId(
        context,
        agent,
        permissionEntityId,
        BasicCRUDActions.Update
      );
      break;
    }

    case AppResourceType.Collaborator: {
      await checkCollaboratorAuthorizationWithCollaboratorId(
        context,
        agent,
        organizationId,
        permissionEntityId,
        BasicCRUDActions.Update
      );
      break;
    }

    default:
      throw new InvalidRequestError('Provided entity type is not supported');
  }
}
