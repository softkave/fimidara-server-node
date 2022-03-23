import {indexArray} from '../../../utilities/indexArray';
import {INewPermissionItemInputByEntity} from '../../permissionItems/replaceItemsByEntity/types';
import {permissionItemIndexer} from '../../permissionItems/utils';

export function expectItemsContain(
  expectedItems: INewPermissionItemInputByEntity[],
  matches: INewPermissionItemInputByEntity[]
) {
  const publicPresetPermissionitemsMap = indexArray(expectedItems, {
    indexer: permissionItemIndexer,
  });

  matches.forEach(item => {
    expect(
      publicPresetPermissionitemsMap[permissionItemIndexer(item)]
    ).toMatchObject(item);
  });
}
