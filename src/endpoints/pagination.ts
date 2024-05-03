import {defaultTo} from 'lodash-es';
import {kEndpointConstants} from './constants.js';
import {getPage} from './contexts/data/utils.js';
import {PaginationQuery} from './types.js';

export function applyDefaultEndpointPaginationOptions(data: PaginationQuery) {
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

  return data;
}

export function getEndpointPageFromInput(
  p: PaginationQuery,
  defaultPage = 0
): number {
  return defaultTo(getPage(p.page), defaultPage);
}
