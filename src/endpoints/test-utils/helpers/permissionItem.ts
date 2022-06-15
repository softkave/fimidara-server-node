import {AppResourceType} from '../../../definitions/system';
import {indexArray} from '../../../utilities/indexArray';
import {INewPermissionItemInput} from '../../permissionItems/addItems/types';
import {INewPermissionItemInputByEntity} from '../../permissionItems/replaceItemsByEntity/types';
import {
  IPermissionItemBase,
  permissionItemIndexer,
} from '../../permissionItems/utils';

export function expectItemsPresent(
  items: IPermissionItemBase[],
  expected: INewPermissionItemInput[]
) {
  const publicPermissionGroupPermissionitemsMap = indexArray(items, {
    indexer: permissionItemIndexer,
  });

  expected.forEach(item => {
    expect(
      publicPermissionGroupPermissionitemsMap[permissionItemIndexer(item)]
    ).toMatchObject(item);
  });
}

function inputByEntityToItem(
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

export function expectItemsByEntityPresent(
  expectedItems: IPermissionItemBase[],
  matches: INewPermissionItemInputByEntity[],
  permissionEntityId: string,
  permissionEntityType: AppResourceType
) {
  const publicPermissionGroupPermissionitemsMap = indexArray(expectedItems, {
    indexer: permissionItemIndexer,
  });

  matches.forEach(item => {
    expect(
      publicPermissionGroupPermissionitemsMap[
        permissionItemIndexer(
          inputByEntityToItem(item, permissionEntityId, permissionEntityType)
        )
      ]
    ).toMatchObject(item);
  });
}
