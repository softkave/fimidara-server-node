import {get} from 'lodash';

function defaultIndexer(data: any, path: any) {
    if (path) {
        return get(data, path);
    }

    if (data && data.toString) {
        return data.toString();
    }

    return String(data);
}

function defaultReducer(data: any) {
    return data;
}

type GetPathType<T> = T extends object ? keyof T : undefined;

export interface IIndexArrayOptions<T, R> {
    path?: GetPathType<T>;
    indexer?: (
        current: T,
        path: GetPathType<T>,
        arr: T[],
        index: number
    ) => string;
    reducer?: (current: T, arr: T[], index: number) => R;
}

export function indexArray<T, R = T>(
    arr: T[] = [],
    opts: IIndexArrayOptions<T, R> = {}
): {[key: string]: R} {
    const indexer = opts.indexer || defaultIndexer;
    const path = opts.path;
    const reducer = opts.reducer || defaultReducer;

    if (typeof indexer !== 'function') {
        if (typeof path !== 'string') {
            console.error(
                new Error('Path must be provided if an indexer is not provided')
            );

            return {};
        }
    }

    const result = arr.reduce((accumulator, current, index) => {
        const key = indexer(current, path as any, arr, index);
        accumulator[key] = reducer(current, arr, index);

        return accumulator;
    }, {} as {[key: string]: R});

    return result;
}
