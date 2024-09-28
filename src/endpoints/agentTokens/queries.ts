import {AgentTokenQuery} from '../../contexts/data/types.js';
import {TokenAccessScope} from '../../definitions/system.js';
import {toCompactArray} from '../../utils/fns.js';

function getByEntityAndScope(data: {
  forEntityId: string;
  scope: TokenAccessScope | TokenAccessScope[] | undefined;
}): AgentTokenQuery {
  const {forEntityId, scope} = data;
  return {
    forEntityId,
    scope: scope
      ? scope.length
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {$all: toCompactArray(scope) as any}
        : {$eq: []}
      : undefined,
  };
}

export abstract class AgentTokenQueries {
  static getByEntityAndScope = getByEntityAndScope;
}
