import {IFimidaraCmdOptionDef} from './types.js';

export const kFimidaraCmdOpts = {
  authToken: {
    shortName: '-t',
    longName: '--authtoken',
    description: 'fimidara auth token',
    type: 'string',
    isRequired: false,
  },
} satisfies Record<string, IFimidaraCmdOptionDef>;
