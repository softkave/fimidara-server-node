import {AnyFn} from '../../../utilities/types';
import {
  IBaseContext,
  IBaseContextDataProviders,
} from '../../contexts/BaseContext';
import {IEmailProviderContext} from '../../contexts/EmailProviderContext';
import {IFilePersistenceProviderContext} from '../../contexts/FilePersistenceProviderContext';

export type LayerJestMock<T extends object> = {
  [K in keyof T]: T[K] extends AnyFn
    ? jest.Mock<ReturnType<T[K]>, Parameters<T[K]>>
    : T[K];
};

export type ITestEmailProviderContext = LayerJestMock<IEmailProviderContext>;
export type ITestFilePersistenceProviderContext = LayerJestMock<IFilePersistenceProviderContext>;

export interface ITestBaseContext
  extends IBaseContext<
    IBaseContextDataProviders,
    ITestEmailProviderContext,
    ITestFilePersistenceProviderContext
  > {}
