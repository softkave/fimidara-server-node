import {usageCosts} from '../constants';
import {GetUsageCostsEndpoint} from './types';

const getUsageCosts: GetUsageCostsEndpoint = async (context, instData) => {
  return {costs: usageCosts};
};

export default getUsageCosts;
