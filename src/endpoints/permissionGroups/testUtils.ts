import {
  AssignPermissionGroupInput,
  PermissionGroup,
} from '../../definitions/permissionGroups';
import {PermissionAction} from '../../definitions/permissionItem';
import {SessionAgent} from '../../definitions/system';
import {makeKey} from '../../utils/fns';
import {addAssignedPermissionGroupList} from '../assignedItems/addAssignedItems';
import {BaseContextType, IServerRequest} from '../contexts/types';
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
  context: BaseContextType,
  agent: SessionAgent,
  workspaceId: string,
  entityIdList: string[],
  pgInputList: AssignPermissionGroupInput[]
) {
  await context.semantic.utils.withTxn(context, async opts =>
    addAssignedPermissionGroupList(
      context,
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
  context: BaseContextType,
  req: IServerRequest,
  workspaceId: string,
  agentId: string,
  targetIdList: string[],
  action: PermissionAction
) {
  await addPermissionItems(
    context,
    RequestData.fromExpressRequest(req, {
      workspaceId,
      items: [
        {action, target: {targetId: targetIdList}, access: true, entityId: agentId},
      ],
    })
  );
}
