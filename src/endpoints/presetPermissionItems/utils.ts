import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {IPublicPresetPermissionsItem} from './types';

const presetPermissionsItemFields = getFields<IPublicPresetPermissionsItem>({
  itemId: true,
  organizationId: true,
  createdAt: getDateString,
  createdBy: true,
  lastUpdatedAt: getDateString,
  lastUpdatedBy: true,
});

export const presetPermissionsItemExtractor = makeExtract(
  presetPermissionsItemFields
);

export const presetPermissionsItemListExtractor = makeListExtract(
  presetPermissionsItemFields
);

export abstract class PresetPermissionsItemUtils {
  static extractPublicPresetPermissionsItem = presetPermissionsItemExtractor;
  static extractPublicPresetPermissionsItemList = presetPermissionsItemListExtractor;
}
