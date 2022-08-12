import {IPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDate} from '../../../utilities/dateFns';
import {indexArray} from '../../../utilities/indexArray';
import {getNewIdForResource} from '../../../utilities/resourceId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {checkWorkspaceExists} from '../../workspaces/utils';
import PermissionItemQueries from '../queries';
import {permissionItemIndexer, PermissionItemUtils} from '../utils';
import {AddPermissionItemsEndpoint} from './types';
import {addPermissionItemsJoiSchema} from './validation';

const addPermissionItems: AddPermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addPermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = await getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    action: BasicCRUDActions.GrantPermission,
    type: AppResourceType.PermissionItem,
    permissionOwners: makeWorkspacePermissionOwnerList(workspaceId),
  });

  const hashList: string[] = [];
  const inputItems: IPermissionItem[] = data.items.map(input => {
    const item: IPermissionItem = {
      workspaceId,
      ...input,
      resourceId: getNewIdForResource(AppResourceType.PermissionItem),
      createdAt: getDate(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      hash: '',
    };

    item.hash = permissionItemIndexer(item);
    hashList.push(item.hash);
    return item;
  });

  const existingItems = await context.data.permissionItem.getManyItems(
    PermissionItemQueries.getByHashList(workspaceId, hashList)
  );

  const existingItemsMap = indexArray(existingItems, {path: 'hash'});
  const newItems = inputItems.filter(item => {
    return !existingItemsMap[item.hash];
  });

  await context.data.permissionItem.bulkSaveItems(newItems);
  const totalItems = existingItems.concat(newItems);
  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(totalItems),
  };
};

export default addPermissionItems;
