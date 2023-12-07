import {defaultTo} from 'lodash';
import {endpointConstants} from './constants';
import {getPage} from './contexts/data/utils';
import {PaginationQuery} from './types';

export function applyDefaultEndpointPaginationOptions(data: PaginationQuery) {
  if (data.page === undefined) {
    data.page = endpointConstants.minPage;
  } else {
    data.page = Math.max(endpointConstants.minPage, data.page);
  }

  if (data.pageSize === undefined) {
    data.pageSize = endpointConstants.maxPageSize;
  } else {
    data.pageSize = Math.max(endpointConstants.minPageSize, data.pageSize);
  }

  return data;
}

export function getEndpointPageFromInput(p: PaginationQuery, defaultPage = 0): number {
  return defaultTo(getPage(p.page), defaultPage);
}
