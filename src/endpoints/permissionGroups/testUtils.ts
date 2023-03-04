import {IAssignPermissionGroupInput, IPermissionGroup} from '../../definitions/permissionGroups';
import {BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {makeKey} from '../../utils/fns';
import {addAssignedPermissionGroupList} from '../assignedItems/addAssignedItems';
import {IBaseContext, IServerRequest} from '../contexts/types';
import {insertPermissionItemsForTestForEntity} from '../testUtils/testUtils';

export function includesPermissionGroupById(pgList: IPermissionGroup[], id: string) {
  return !!pgList.find(pg => pg.resourceId === id);
}

export function makeKeyFromAssignedPermissionGroupMetaOrInput(item: {permissionGroupId: string}) {
  return makeKey([item.permissionGroupId]);
}

export function toAssignedPgListInput(pgList: Pick<IPermissionGroup, 'resourceId'>[]) {
  return pgList.map(
    (pg, index): IAssignPermissionGroupInput => ({
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
  await addAssignedPermissionGroupList(
    context,
    agent,
    workspaceId,
    pgListAssignedTo01Input,
    idList,
    false,
    true
  );
}

export async function grantReadPermission(
  context: IBaseContext,
  req: IServerRequest,
  workspaceId: string,
  agentId: string,
  targetIdList: string[]
) {
  await insertPermissionItemsForTestForEntity(
    context,
    req,
    workspaceId,
    agentId,
    {containerId: workspaceId},
    targetIdList.map(id => ({targetId: id, action: BasicCRUDActions.Read}))
  );
}
