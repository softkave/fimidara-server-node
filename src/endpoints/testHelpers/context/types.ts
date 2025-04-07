import {Mock} from 'vitest';
import {IEmailProviderContext} from '../../../contexts/email/types.js';
import {FilePersistenceProvider} from '../../../contexts/file/types.js';
import {AnyFn} from '../../../utils/types.js';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type LayerJestMock<T extends {[key: string]: any}> = {
  [K in keyof T]: T[K] extends AnyFn ? Mock<T[K]> : T[K];
};

export type TestEmailProviderContext = LayerJestMock<IEmailProviderContext>;
export type TestFilePersistenceProviderContext =
  LayerJestMock<FilePersistenceProvider>;
