import {
  ISessionAgent,
  AppResourceType,
  BasicCRUDActions,
} from '../../definitions/system';
import {checkClientAssignedTokenAuthorization02} from '../clientAssignedTokens/utils';
import {checkCollaboratorAuthorization02} from '../collaborators/utils';
import {IBaseContext} from '../contexts/BaseContext';
import {InvalidRequestError} from '../errors';
import {checkPresetPermissionsGroupAuthorization02} from '../presetPermissionsGroups/utils';
import {checkProgramAccessTokenAuthorization02} from '../programAccessTokens/utils';

export default async function checkEntityExists(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  permissionEntityId: string,
  permissionEntityType: AppResourceType
) {
  switch (permissionEntityType) {
    case AppResourceType.ClientAssignedToken: {
      await checkClientAssignedTokenAuthorization02(
        context,
        agent,
        permissionEntityId,
        BasicCRUDActions.Update
      );
      break;
    }

    case AppResourceType.ProgramAccessToken: {
      await checkProgramAccessTokenAuthorization02(
        context,
        agent,
        permissionEntityId,
        BasicCRUDActions.Update
      );
      break;
    }

    case AppResourceType.PresetPermissionsGroup: {
      await checkPresetPermissionsGroupAuthorization02(
        context,
        agent,
        permissionEntityId,
        BasicCRUDActions.Update
      );
      break;
    }

    case AppResourceType.Collaborator: {
      await checkCollaboratorAuthorization02(
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
