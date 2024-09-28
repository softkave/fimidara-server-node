import {identity} from 'lodash-es';
import {indexArray} from 'softkave-js-utils';
import {AppExportedHttpEndpoints} from '../endpoints/endpoints.js';

export function filterEndpoints(
  endpoints: AppExportedHttpEndpoints,
  tags: string[]
) {
  const tagsMap = indexArray(tags, {indexer: identity});
  return endpoints.filter(endpoint => {
    return endpoint.tag.some(tag => tagsMap[tag]);
  });
}
