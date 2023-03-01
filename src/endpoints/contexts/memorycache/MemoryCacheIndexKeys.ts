import {makeKey} from '../../../utils/fns';

export const MemoryCacheIndexKeys = {
  Separator: '_' as const,
  makeKey(parts: string[]) {
    return makeKey(parts, this.Separator);
  },

  assignedItems: {
    AssignedItemId: 'assignedItemId',
    AssignedToItemId: 'assignedToItemId',
  } as const,

  permissionItems: {
    PermissionEntity: 'permissionEntity',
  } as const,
};
