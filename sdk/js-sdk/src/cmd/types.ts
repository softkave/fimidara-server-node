import {AnyAsyncFn} from 'softkave-js-utils';

export interface IFimidaraCmdOpts {
  authToken?: string;
  serverURL?: string;
  silent?: boolean;
}

export interface IFimidaraCmdOptionDef {
  shortName: string;
  longName: string;
  type: string;
  isRequired: boolean;
  description?: string;
  choices?: string[];
  defaultValue?: unknown;
}

export interface IFimidaraCmdDef<
  TOptions extends IFimidaraCmdOpts = IFimidaraCmdOpts
> {
  cmd: string;
  description: string;
  options: IFimidaraCmdOptionDef[];
  action: AnyAsyncFn<[TOptions]>;
}
