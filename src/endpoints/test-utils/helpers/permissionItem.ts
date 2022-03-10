import {indexArray} from '../../../utilities/indexArray';
import {INewPermissionItemInput} from '../../permissionItems/addItems/types';

export function expectItemsContain(
  expectedItems: INewPermissionItemInput[],
  matches: INewPermissionItemInput[]
) {
  const permissionItemIndexer = (item: INewPermissionItemInput) =>
    item.permissionOwnerId +
    '-' +
    item.permissionOwnerType +
    '-' +
    item.itemResourceId +
    '-' +
    item.itemResourceType +
    '-' +
    item.action +
    '-' +
    item.isExclusion +
    '-' +
    item.isForPermissionOwnerOnly;

  const publicPresetPermissionitemsMap = indexArray(expectedItems, {
    indexer: permissionItemIndexer,
  });

  matches.forEach(item => {
    expect(
      publicPresetPermissionitemsMap[permissionItemIndexer(item)]
    ).toMatchObject(item);
  });
}
