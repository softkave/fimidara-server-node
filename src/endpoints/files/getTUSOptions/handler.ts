import {kFileConstants} from '../constants.js';
import {GetTUSOptionsEndpoint} from './types.js';

const getTUSOptions: GetTUSOptionsEndpoint = async reqData => {
  return {
    version: kFileConstants.tus.versions.join(','),
    extensions: kFileConstants.tus.extensions,
    resumable: kFileConstants.tus.versions[0],
    maxSize: kFileConstants.maxFileSizeInBytes,
  };
};

export default getTUSOptions;
