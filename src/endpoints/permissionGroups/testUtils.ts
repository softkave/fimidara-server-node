import {
  IAssignedPermissionGroupMeta,
  IAssignPermissionGroupInput,
  IPermissionGroup,
} from '../../definitions/permissionGroups';
import {BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {makeKey} from '../../utils/fns';
import {addAssignedPermissionGroupList} from '../assignedItems/addAssignedItems';
import {IBaseContext, IServerRequest} from '../contexts/types';
import {insertPermissionItemsForTestForEntity} from '../test-utils/test-utils';

export function includesPermissionGroupById(pgList: IPermissionGroup[], id: string) {
  return !!pgList.find(pg => pg.resourceId === id);
}

export function makeKeyFromAssignedPermissionGroupMetaOrInput(
  item: IAssignPermissionGroupInput | IAssignedPermissionGroupMeta
) {
  return makeKey([item.permissionGroupId, item.order]);
}

export function toAssignedPgListInput(pgList: IPermissionGroup[]) {
  return pgList.map(
    (pg, index): IAssignPermissionGroupInput => ({
      permissionGroupId: pg.resourceId,
      order: index,
    })
  );
}

export async function assignPgListToIdList(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  idList: string[],
  pgListAssignedTo01Input: IAssignPermissionGroupInput[]
) {
  await addAssignedPermissionGroupList(
    context,
    agent,
    workspace,
    pgListAssignedTo01Input,
    idList,
    false,
    true
  );
}

export async function grantReadPermission(
  context: IBaseContext,
  req: IServerRequest,
  workspace: IWorkspace,
  agentId: string,
  targetIdList: string[]
) {
  await insertPermissionItemsForTestForEntity(
    context,
    req,
    workspace.resourceId,
    {entityId: agentId},
    {containerId: workspace.resourceId},
    targetIdList.map(id => ({targetId: id, action: BasicCRUDActions.Read}))
  );
}