import {IAssignedPermissionGroup} from '../../../definitions/permissionGroups';
import {AppResourceType, ISessionAgent, SessionAgentType} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {getCollaboratorWorkspace} from '../../collaborators/utils';

export interface IPermissionEntity {
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  order?: number;
}

function extractPermissionGroupsData(permissionGroups: IAssignedPermissionGroup[]) {
  return permissionGroups.map(item => ({
    permissionEntityId: item.permissionGroupId,
    permissionEntityType: AppResourceType.PermissionGroup,
    order: item.order,
  }));
}

export function getPermissionEntities(agent: ISessionAgent, workspace: IWorkspace): Array<IPermissionEntity> {
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
          extractPermissionGroupsData(
            getCollaboratorWorkspace(agent.user, workspace.resourceId)?.permissionGroups || []
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
        ].concat(extractPermissionGroupsData(agent.clientAssignedToken.permissionGroups));
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
        ].concat(extractPermissionGroupsData(agent.programAccessToken.permissionGroups));
      }
      break;
    }
  }

  if (workspace.publicPermissionGroupId) {
    permissionEntities = permissionEntities.concat([
      {
        permissionEntityId: workspace.publicPermissionGroupId,
        permissionEntityType: AppResourceType.PermissionGroup,
      },
    ]);
  }

  return permissionEntities;
}
