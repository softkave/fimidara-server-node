import {defaultTo} from 'lodash-es';
import {getPage} from '../contexts/data/utils.js';
import {kEndpointConstants} from './constants.js';
import {PaginationQuery} from './types.js';

export function applyDefaultEndpointPaginationOptions<
  T extends PaginationQuery,
>(data: T) {
  if (data.page === undefined) {
    data.page = kEndpointConstants.minPage;
  } else {
    data.page = Math.max(kEndpointConstants.minPage, data.page);
  }

  if (data.pageSize === undefined) {
    data.pageSize = kEndpointConstants.maxPageSize;
  } else {
    data.pageSize = Math.max(kEndpointConstants.minPageSize, data.pageSize);
  }

  return data as T & Required<PaginationQuery>;
}

export function getEndpointPageFromInput(
  p: PaginationQuery,
  defaultPage = 0
): number {
  return defaultTo(getPage(p.page), defaultPage);
}
