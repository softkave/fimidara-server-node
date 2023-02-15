import {AppResourceType} from '../../../definitions/system';
import {indexArray} from '../../../utils/indexArray';
import {INewPermissionItemInput} from '../../permissionItems/addItems/types';
import {INewPermissionItemInputByEntity} from '../../permissionItems/replaceItemsByEntity/types';
import {IPermissionItemBase, permissionItemIndexer} from '../../permissionItems/utils';

export function expectItemsPresent(
  items: IPermissionItemBase[],
  expected: INewPermissionItemInput[]
) {
  const publicPermissionGroupPermissionitemsMap = indexArray(items, {
    indexer: permissionItemIndexer,
  });

  expected.forEach(item => {
    expect(publicPermissionGroupPermissionitemsMap[permissionItemIndexer(item)]).toMatchObject(
      item
    );
  });
}

function permissionItemInputToItemBase(
  input: INewPermissionItemInputByEntity,
  permissionEntityId: string,
  permissionEntityType: AppResourceType
): IPermissionItemBase {
  return {
    ...input,
    permissionEntityId,
    permissionEntityType,
  };
}

export function expectPermissionItemsForEntityPresent(
  expectedItems: IPermissionItemBase[],
  matches: INewPermissionItemInputByEntity[],
  permissionEntityId: string,
  permissionEntityType: AppResourceType
) {
  const permissionItemsMap = indexArray(expectedItems, {
    indexer: permissionItemIndexer,
  });

  matches.forEach(item => {
    const input = permissionItemInputToItemBase(item, permissionEntityId, permissionEntityType);
    const key = permissionItemIndexer(input);
    expect(permissionItemsMap[key]).toMatchObject(item);
  });
}
