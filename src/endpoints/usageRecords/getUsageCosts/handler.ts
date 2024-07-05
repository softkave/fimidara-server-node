import {kUsageCostsPerByte} from '../constants.js';
import {GetUsageCostsEndpoint} from './types.js';

const getUsageCosts: GetUsageCostsEndpoint = async () => {
  return {costs: kUsageCostsPerByte};
};

export default getUsageCosts;
