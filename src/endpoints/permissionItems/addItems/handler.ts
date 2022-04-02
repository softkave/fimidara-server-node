import {IPermissionItem} from '../../../definitions/permissionItem';
import {BasicCRUDActions, AppResourceType} from '../../../definitions/system';
import {getDate} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {indexArray} from '../../../utilities/indexArray';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getOrganizationId} from '../../contexts/SessionContext';
import {checkOrganizationExists} from '../../organizations/utils';
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
  const organizationId = await getOrganizationId(agent, data.organizationId);
  const organization = await checkOrganizationExists(context, organizationId);
  await checkAuthorization({
    context,
    agent,
    organization,
    action: BasicCRUDActions.GrantPermission,
    type: AppResourceType.PermissionItem,
    permissionOwners: makeOrgPermissionOwnerList(organizationId),
  });

  const hashList: string[] = [];
  const inputItems: IPermissionItem[] = data.items.map(input => {
    const item: IPermissionItem = {
      organizationId,
      ...input,
      resourceId: getNewId(),
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
    PermissionItemQueries.getByHashList(organizationId, hashList)
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
