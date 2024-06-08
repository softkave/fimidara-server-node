import {usageCosts} from '../constants.js';
import {GetUsageCostsEndpoint} from './types.js';

const getUsageCosts: GetUsageCostsEndpoint = async () => {
  return {costs: usageCosts};
};

export default getUsageCosts;
