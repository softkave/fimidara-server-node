import {AnyFn} from '../../../utils/types';
import {IEmailProviderContext} from '../../contexts/email/types';
import {FilePersistenceProvider} from '../../contexts/file/types';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type LayerJestMock<T extends {[key: string]: any}> = {
  [K in keyof T]: T[K] extends AnyFn
    ? jest.Mock<ReturnType<T[K]>, Parameters<T[K]>>
    : T[K];
};

export type ITestEmailProviderContext = LayerJestMock<IEmailProviderContext>;
export type ITestFilePersistenceProviderContext = LayerJestMock<FilePersistenceProvider>;
