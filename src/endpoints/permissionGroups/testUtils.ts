import {
  AssignPermissionGroupInput,
  PermissionGroup,
} from '../../definitions/permissionGroups';
import {PermissionAction} from '../../definitions/permissionItem';
import {SessionAgent} from '../../definitions/system';
import {makeKey} from '../../utils/fns';
import {addAssignedPermissionGroupList} from '../assignedItems/addAssignedItems';
import {kSemanticModels} from '../contexts/injection/injectables';
import {IServerRequest} from '../contexts/types';
import addPermissionItems from '../permissionItems/addItems/handler';
import RequestData from '../RequestData';

export function includesPermissionGroupById(pgList: PermissionGroup[], id: string) {
  return !!pgList.find(pg => pg.resourceId === id);
}

export function makeKeyFromAssignedPermissionGroupMetaOrInput(item: {
  permissionGroupId: string;
}) {
  return makeKey([item.permissionGroupId]);
}

export function toAssignedPgListInput(pgList: Pick<PermissionGroup, 'resourceId'>[]) {
  return pgList.map(
    (pg): AssignPermissionGroupInput => ({
      permissionGroupId: pg.resourceId,
    })
  );
}

export async function assignPgListToIdList(
  agent: SessionAgent,
  workspaceId: string,
  entityIdList: string[],
  pgInputList: AssignPermissionGroupInput[]
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
  action: PermissionAction
) {
  await addPermissionItems(
    RequestData.fromExpressRequest(req, {
      workspaceId,
      items: [
        {action, target: {targetId: targetIdList}, access: true, entityId: agentId},
      ],
    })
  );
}
