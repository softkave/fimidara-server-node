import {ServerError} from './errors';
import cast from './fns';
import OperationError from './OperationError';

export const fireAndForgetFn = async <Fn extends (...args: any) => any>(
    fn: Fn,
    ...args: Array<Parameters<Fn>>
): Promise<ReturnType<Fn> | undefined> => {
    try {
        return await fn(...args);
    } catch (error) {
        console.error(error);
    }

    return undefined;
};

export const fireAndForgetPromise = async <T>(promise: Promise<T>) => {
    try {
        return await promise;
    } catch (error) {
        console.error(error);
    }

    return undefined;
};

export const wrapFireAndThrowError = <
    Fn extends (...args: any) => any,
    ReturnFn = (
        ...args: Parameters<Fn>
    ) => ReturnType<Fn> extends Promise<any>
        ? ReturnType<Fn>
        : Promise<ReturnType<Fn>>
>(
    fn: Fn,
    throwError = true,
    thrownError: typeof OperationError = ServerError
): ReturnFn => {
    return cast<ReturnFn>(async (...args: any) => {
        try {
            return await fn(...args);
        } catch (error) {
            console.error(error);

            if (throwError) {
                if (thrownError) {
                    throw new thrownError();
                } else {
                    throw error;
                }
            }
        }
    });
};

export const wrapFireAndDontThrow: typeof wrapFireAndThrowError = fn => {
    return wrapFireAndThrowError(fn, false);
};
