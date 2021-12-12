import {IAssignedPresetPermissionsGroup} from '../../../definitions/presetPermissionsGroup';
import {
  AppResourceType,
  ISessionAgent,
  SessionAgentType,
} from '../../../definitions/system';
import {getCollaboratorOrganization} from '../../collaborators/utils';

export interface IPermissionEntity {
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  order?: number;
}

function extractPresetsData(presets: IAssignedPresetPermissionsGroup[]) {
  return presets.map(item => ({
    permissionEntityId: item.presetId,
    permissionEntityType: AppResourceType.PresetPermissionsGroup,
    order: item.order,
  }));
}

export function getPermissionEntities(
  agent: ISessionAgent,
  organizationId: string
): Array<IPermissionEntity> {
  switch (agent.agentType) {
    case SessionAgentType.User: {
      if (agent.user) {
        return [
          {
            permissionEntityId: agent.user.userId,
            permissionEntityType: AppResourceType.User,
            order: 1,
          },
        ].concat(
          extractPresetsData(
            getCollaboratorOrganization(agent.user, organizationId)?.presets ||
              []
          )
        );
      }
      break;
    }

    case SessionAgentType.ClientAssignedToken: {
      if (agent.clientAssignedToken) {
        return [
          {
            permissionEntityId: agent.clientAssignedToken.tokenId,
            permissionEntityType: AppResourceType.ClientAssignedToken,
            order: 1,
          },
        ].concat(extractPresetsData(agent.clientAssignedToken.presets));
      }
      break;
    }

    case SessionAgentType.ProgramAccessToken: {
      if (agent.programAccessToken) {
        return [
          {
            permissionEntityId: agent.programAccessToken.tokenId,
            permissionEntityType: AppResourceType.ProgramAccessToken,
            order: 1,
          },
        ].concat(extractPresetsData(agent.programAccessToken.presets));
      }
      break;
    }
  }

  // TODO: log cause control shouldn't get here
  return [];
}
