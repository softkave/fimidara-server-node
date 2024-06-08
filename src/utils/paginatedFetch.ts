import {isArray, isNil} from 'lodash-es';
import {AnyFn, OrPromise} from './types.js';

export type PaginatedFetchGetFn<TArgs, TData = unknown> = AnyFn<
  [{prevData?: TData; args: TArgs; page: number; pageSize: number}],
  OrPromise<TData>
>;

export type PaginatedFetchProcessFn<TArgs, TData = unknown> = AnyFn<
  [{data: TData; args: TArgs; page: number; pageSize: number}]
>;

export type PaginatedFetchContinueFn<TArgs, TData = unknown> = AnyFn<
  [{data: TData; args: TArgs; page: number; pageSize: number}],
  boolean
>;

export async function paginatedFetch<TArgs, TData>(props: {
  getFn: PaginatedFetchGetFn<TArgs, TData>;
  processFn?: PaginatedFetchProcessFn<TArgs, TData>;
  continueFn?: PaginatedFetchContinueFn<TArgs, TData>;
  args: TArgs;
  page?: number;
  pageSize?: number;
}) {
  const {
    getFn,
    processFn,
    args,
    pageSize = 1000,
    continueFn = ({data}) => {
      return isArray(data) ? data.length > 0 : !isNil(data);
    },
  } = props;
  let {page = 0} = props;
  let data: TData | undefined;
  let shouldContinue = false;

  do {
    data = await getFn({
      args,
      page,
      pageSize,
      prevData: data,
    });

    if (processFn) {
      await processFn({data, page, pageSize, args});
    }

    page += 1;
    shouldContinue = continueFn({data, page, pageSize, args});
  } while (shouldContinue);
}
