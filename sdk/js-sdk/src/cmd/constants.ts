import {IFimidaraCmdOptionDef} from './types.js';

export const kFimidaraCmdOpts = {
  authToken: {
    shortName: '-t',
    longName: '--authToken',
    description: 'fimidara auth token',
    type: 'string',
    isRequired: false,
  },
  serverURL: {
    shortName: '-s',
    longName: '--serverURL',
    description: 'fimidara server URL',
    type: 'string',
    isRequired: false,
  },
} satisfies Record<string, IFimidaraCmdOptionDef>;
