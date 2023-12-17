import {isObject} from 'lodash';
import {FilePersistenceProvider} from './types';

export function isFilePersistenceProvider(
  item: unknown
): item is FilePersistenceProvider {
  return (
    isObject(item) &&
    !!(item as FilePersistenceProvider).supportsFeature &&
    !!(item as FilePersistenceProvider).uploadFile &&
    !!(item as FilePersistenceProvider).readFile
  );
}
