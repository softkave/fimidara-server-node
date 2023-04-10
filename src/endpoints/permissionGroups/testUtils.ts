import {IAssignPermissionGroupInput, IPermissionGroup} from '../../definitions/permissionGroups';
import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {AppActionType, ISessionAgent} from '../../definitions/system';
import {makeKey} from '../../utils/fns';
import {addAssignedPermissionGroupList} from '../assignedItems/addAssignedItems';
import {executeWithMutationRunOptions} from '../contexts/semantic/utils';
import {IBaseContext, IServerRequest} from '../contexts/types';
import addPermissionItems from '../permissionItems/addItems/handler';
import RequestData from '../RequestData';

export function includesPermissionGroupById(pgList: IPermissionGroup[], id: string) {
  return !!pgList.find(pg => pg.resourceId === id);
}

export function makeKeyFromAssignedPermissionGroupMetaOrInput(item: {permissionGroupId: string}) {
  return makeKey([item.permissionGroupId]);
}

export function toAssignedPgListInput(pgList: Pick<IPermissionGroup, 'resourceId'>[]) {
  return pgList.map(
    (pg): IAssignPermissionGroupInput => ({
      permissionGroupId: pg.resourceId,
    })
  );
}

export async function assignPgListToIdList(
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  idList: string[],
  pgListAssignedTo01Input: IAssignPermissionGroupInput[]
) {
  await executeWithMutationRunOptions(context, async opts =>
    addAssignedPermissionGroupList(
      context,
      agent,
      workspaceId,
      pgListAssignedTo01Input,
      idList,
      /** delete existing */ false,
      /** skip permission groups check */ true,
      /** skip auth check */ true,
      opts
    )
  );
}

export async function grantReadPermission(
  context: IBaseContext,
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
