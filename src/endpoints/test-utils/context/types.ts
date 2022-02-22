import {AnyFn} from '../../../utilities/types';
import {
  IBaseContext,
  IBaseContextDataProviders,
} from '../../contexts/BaseContext';
import {IEmailProviderContext} from '../../contexts/EmailProviderContext';
import {IFilePersistenceProviderContext} from '../../contexts/FilePersistenceProviderContext';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type LayerJestMock<T extends {[key: string]: any}> = {
  [K in keyof T]: T[K] extends AnyFn
    ? jest.Mock<ReturnType<T[K]>, Parameters<T[K]>>
    : T[K];
};

export type ITestEmailProviderContext = LayerJestMock<IEmailProviderContext>;
export type ITestFilePersistenceProviderContext =
  LayerJestMock<IFilePersistenceProviderContext>;

export type ITestBaseContext = IBaseContext<
  IBaseContextDataProviders,
  ITestEmailProviderContext,
  ITestFilePersistenceProviderContext
>;
