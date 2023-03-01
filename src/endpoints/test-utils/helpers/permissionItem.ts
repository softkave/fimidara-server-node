import {indexArray} from '../../../utils/indexArray';
import {INewPermissionItemInput} from '../../permissionItems/addItems/types';
import {INewPermissionItemInputByEntity} from '../../permissionItems/replaceItemsByEntity/types';
import {
  getTargetType,
  IPermissionItemBase,
  permissionItemIndexer,
} from '../../permissionItems/utils';

export function expectPermissionItemsPresent(
  items: IPermissionItemBase[],
  expected: INewPermissionItemInput[]
) {
  const map = indexArray(items, {
    indexer: permissionItemIndexer,
  });
  expected.forEach(item => {
    expect(map[permissionItemIndexer(item)]).toMatchObject(item);
  });
}

function permissionItemInputToItemBase(
  input: INewPermissionItemInputByEntity,
  entityId: string
): IPermissionItemBase {
  const targetType = getTargetType(input);
  return {
    ...input,
    targetType,
    entityId: entityId,
  };
}

export function expectPermissionItemsForEntityPresent(
  expectedItems: IPermissionItemBase[],
  matches: INewPermissionItemInputByEntity[],
  entityId: string
) {
  const permissionItemsMap = indexArray(expectedItems, {
    indexer: permissionItemIndexer,
  });
  matches.forEach(item => {
    const input = permissionItemInputToItemBase(item, entityId);
    const key = permissionItemIndexer(input);
    expect(permissionItemsMap[key]).toMatchObject(item);
  });
}
