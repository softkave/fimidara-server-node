import {isNumber} from 'lodash-es';
import {kEndpointConstants} from '../../endpoints/constants.js';

export function getPage(
  inputPage?: number,
  minPage = kEndpointConstants.minPage
) {
  return isNumber(inputPage)
    ? Math.max(inputPage, minPage) // return 0 if page is negative
    : undefined;
}

export function getPageSize(
  inputPageSize?: number,
  inputPage?: number,
  maxPageSize = kEndpointConstants.maxPageSize,
  minPageSize = kEndpointConstants.minPageSize
) {
  const pageSize = isNumber(inputPageSize)
    ? Math.max(inputPageSize, minPageSize)
    : isNumber(inputPage)
      ? maxPageSize
      : undefined;

  if (pageSize) {
    return Math.min(pageSize, maxPageSize);
  }

  return pageSize;
}
