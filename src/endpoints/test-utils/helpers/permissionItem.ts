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
  permissionEntityId: string
): IPermissionItemBase {
  return {
    ...input,
    permissionEntityId,
  };
}

export function expectPermissionItemsForEntityPresent(
  expectedItems: IPermissionItemBase[],
  matches: INewPermissionItemInputByEntity[],
  permissionEntityId: string
) {
  const permissionItemsMap = indexArray(expectedItems, {
    indexer: permissionItemIndexer,
  });
  matches.forEach(item => {
    const input = permissionItemInputToItemBase(item, permissionEntityId);
    const key = permissionItemIndexer(input);
    expect(permissionItemsMap[key]).toMatchObject(item);
  });
}
