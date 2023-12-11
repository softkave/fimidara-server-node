import {usageCosts} from '../constants';
import {GetUsageCostsEndpoint} from './types';

const getUsageCosts: GetUsageCostsEndpoint = async () => {
  return {costs: usageCosts};
};

export default getUsageCosts;
