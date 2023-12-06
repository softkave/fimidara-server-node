import {defaultTo} from 'lodash';
import {endpointConstants} from './constants';
import {getPage} from './contexts/data/utils';
import {PaginationQuery} from './types';

export interface InternalPagination<Token = unknown> {
  token?: Token;
}

export interface InternalPaginationQuery<Token = unknown>
  extends InternalPagination<Token> {
  pageSize: number;
  page: number;
}

export function paginationToContinuationToken(pagination: InternalPagination) {
  return Buffer.from(JSON.stringify(pagination), 'utf8').toString('hex');
}

export function continuationTokenToPagination<Token = unknown>(token: string) {
  return JSON.parse(Buffer.from(token).toString('utf-8')) as InternalPagination<Token>;
}

export function getInternalPaginationQuery<Token = unknown>(
  data: PaginationQuery
): InternalPaginationQuery<Token> {
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

  return {
    page: data.page,
    pageSize: data.pageSize,
    token: data.continuationToken
      ? (continuationTokenToPagination(data.continuationToken) as Token)
      : undefined,
  };
}

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
