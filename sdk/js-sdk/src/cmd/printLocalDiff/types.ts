import {IFimidaraCmdOpts} from '../types.js';

export interface IFimidaraPrintLocalDiffOpts extends IFimidaraCmdOpts {
  localFilepath01: string;
  localFilepath02: string;
}
