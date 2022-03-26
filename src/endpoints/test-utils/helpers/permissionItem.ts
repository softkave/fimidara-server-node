import {AppResourceType} from '../../../definitions/system';
import {indexArray} from '../../../utilities/indexArray';
import {INewPermissionItemInputByEntity} from '../../permissionItems/replaceItemsByEntity/types';
import {INewPermissionItemInputByResource} from '../../permissionItems/replaceItemsByResource/types';
import {
  IPermissionItemBase,
  permissionItemIndexer,
} from '../../permissionItems/utils';

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
  const publicPresetPermissionitemsMap = indexArray(expectedItems, {
    indexer: permissionItemIndexer,
  });

  matches.forEach(item => {
    expect(
      publicPresetPermissionitemsMap[
        permissionItemIndexer(
          inputByEntityToItem(item, permissionEntityId, permissionEntityType)
        )
      ]
    ).toMatchObject(item);
  });
}

function inputByResourceToItem(
  input: INewPermissionItemInputByResource,
  permissionOwnerId: string,
  permissionOwnerType: AppResourceType,
  itemResourceId: string | undefined,
  itemResourceType: AppResourceType
): IPermissionItemBase {
  return {
    ...input,
    itemResourceType,
    permissionOwnerId,
    permissionOwnerType,
    itemResourceId,
  };
}

export function expectItemsByResourcePresent(
  expectedItems: IPermissionItemBase[],
  matches: INewPermissionItemInputByResource[],
  permissionOwnerId: string,
  permissionOwnerType: AppResourceType,
  itemResourceId: string | undefined,
  itemResourceType: AppResourceType
) {
  const publicPresetPermissionitemsMap = indexArray(expectedItems, {
    indexer: permissionItemIndexer,
  });

  matches.forEach(item => {
    const formedItem = inputByResourceToItem(
      item,
      permissionOwnerId,
      permissionOwnerType,
      itemResourceId,
      itemResourceType
    );

    const key = permissionItemIndexer(formedItem);
    expect(publicPresetPermissionitemsMap[key]).toMatchObject(item);
  });
}
