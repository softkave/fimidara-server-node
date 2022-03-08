import {IOrganization} from '../../../definitions/organization';
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
  organization: IOrganization
): Array<IPermissionEntity> {
  let permissionEntities: Array<IPermissionEntity> = [];

  switch (agent.agentType) {
    case SessionAgentType.User: {
      if (agent.user) {
        permissionEntities = [
          {
            permissionEntityId: agent.user.resourceId,
            permissionEntityType: AppResourceType.User,
            order: 1,
          },
        ].concat(
          extractPresetsData(
            getCollaboratorOrganization(agent.user, organization.resourceId)
              ?.presets || []
          )
        );
      }
      break;
    }

    case SessionAgentType.ClientAssignedToken: {
      if (agent.clientAssignedToken) {
        permissionEntities = [
          {
            permissionEntityId: agent.clientAssignedToken.resourceId,
            permissionEntityType: AppResourceType.ClientAssignedToken,
            order: 1,
          },
        ].concat(extractPresetsData(agent.clientAssignedToken.presets));
      }
      break;
    }

    case SessionAgentType.ProgramAccessToken: {
      if (agent.programAccessToken) {
        permissionEntities = [
          {
            permissionEntityId: agent.programAccessToken.resourceId,
            permissionEntityType: AppResourceType.ProgramAccessToken,
            order: 1,
          },
        ].concat(extractPresetsData(agent.programAccessToken.presets));
      }
      break;
    }
  }

  if (organization.publicPresetId) {
    permissionEntities = permissionEntities.concat([
      {
        permissionEntityId: organization.publicPresetId,
        permissionEntityType: AppResourceType.PresetPermissionsGroup,
      },
    ]);
  }

  return permissionEntities;
}
