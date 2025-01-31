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
    shortName: '-u',
    longName: '--serverURL',
    description: 'fimidara server URL',
    type: 'string',
    isRequired: false,
  },
  silent: {
    shortName: '-s',
    longName: '--silent',
    description: 'do not print logs',
    type: 'boolean',
    isRequired: false,
    defaultValue: false,
  },
} satisfies Record<string, IFimidaraCmdOptionDef>;
