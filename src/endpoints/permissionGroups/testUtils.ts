import {AssignPermissionGroupInput, PermissionGroup} from '../../definitions/permissionGroups';
import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {AppActionType, SessionAgent} from '../../definitions/system';
import {makeKey} from '../../utils/fns';
import {addAssignedPermissionGroupList} from '../assignedItems/addAssignedItems';
import {executeWithMutationRunOptions} from '../contexts/semantic/utils';
import {BaseContextType, IServerRequest} from '../contexts/types';
import addPermissionItems from '../permissionItems/addItems/handler';
import RequestData from '../RequestData';

export function includesPermissionGroupById(pgList: PermissionGroup[], id: string) {
  return !!pgList.find(pg => pg.resourceId === id);
}

export function makeKeyFromAssignedPermissionGroupMetaOrInput(item: {permissionGroupId: string}) {
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
  await executeWithMutationRunOptions(context, async opts =>
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

export async function grantReadPermission(
  context: BaseContextType,
  req: IServerRequest,
  workspaceId: string,
  agentId: string,
  targetIdList: string[]
) {
  await addPermissionItems(
    context,
    RequestData.fromExpressRequest(req, {
      workspaceId,
      entity: {entityId: agentId},
      items: [
        {
          target: {targetId: targetIdList},
          action: AppActionType.Read,
          grantAccess: true,
          appliesTo: PermissionItemAppliesTo.Self,
        },
      ],
    })
  );
}
