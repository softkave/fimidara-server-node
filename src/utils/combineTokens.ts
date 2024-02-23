import {getRandomInt} from './fns';

export interface CombinationToken {
  token: string;
  /** return `true` to include in selection pool for iteration. */
  filterFn?: (index: number, spent: number, generated: string[]) => boolean;
}

const kDefaultFilterFn = () => true;

export function combineTokens(tokens: CombinationToken[], count: number) {
  const spentRecord: Record<string, number | undefined> = {};
  const result: string[] = [];
  const getAvailableTokens = (index: number) => {
    return tokens.filter(token => {
      const spent = spentRecord[token.token] || 0;
      const filterFn = token.filterFn || kDefaultFilterFn;
      return filterFn(index, spent, result);
    });
  };

  for (
    let i = 0, available = getAvailableTokens(i);
    i < count && available.length > 0;
    i++, available = getAvailableTokens(i)
  ) {
    const index = getRandomInt(0, available.length);
    const token = available[index];
    spentRecord[token.token] = (spentRecord[token.token] || 0) + 1;
    result.push(token.token);
  }

  return result;
}
