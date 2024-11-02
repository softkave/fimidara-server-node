import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {IServerRequest} from '../../contexts/types.js';
import {PermissionGroup} from '../../definitions/permissionGroups.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {SessionAgent} from '../../definitions/system.js';
import {addAssignedPermissionGroupList} from '../assignedItems/addAssignedItems.js';
import RequestData from '../RequestData.js';
import addPermissionItemsEndpoint from './addPermissionItems/handler.js';
import {AddPermissionItemsEndpointParams} from './addPermissionItems/types.js';

export function includesPermissionGroupById(
  pgList: PermissionGroup[],
  id: string
) {
  return !!pgList.find(pg => pg.resourceId === id);
}

export function toAssignedPgListInput(
  pgList: Pick<PermissionGroup, 'resourceId'>[]
) {
  return pgList.map(pg => pg.resourceId);
}

export async function assignPgListToIdList(
  agent: SessionAgent,
  workspaceId: string,
  entityIdList: string[],
  pgInputList: string[]
) {
  await kSemanticModels
    .utils()
    .withTxn(async opts =>
      addAssignedPermissionGroupList(
        agent,
        workspaceId,
        pgInputList,
        entityIdList,
        /** delete existing */ false,
        /** skip permission groups check */ true,
        /** skip auth check */ true,
        opts
      )
    );
}

export async function grantPermission(
  req: IServerRequest,
  workspaceId: string,
  agentId: string,
  targetIdList: string[],
  action: FimidaraPermissionAction
) {
  await addPermissionItemsEndpoint(
    RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(req, {
      workspaceId,
      items: [
        {
          action,
          targetId: targetIdList,
          access: true,
          entityId: agentId,
        },
      ],
    })
  );
}
