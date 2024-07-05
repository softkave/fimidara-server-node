import {kUsageCosts} from '../constants.js';
import {GetUsageCostsEndpoint} from './types.js';

const getUsageCosts: GetUsageCostsEndpoint = async () => {
  return {costs: kUsageCosts};
};

export default getUsageCosts;
