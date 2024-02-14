import {kPermissionsMap} from '../../../definitions/permissionItem';
import {kPermissionAgentTypes} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {fileExtractor, getAndCheckFileAuthorization} from '../utils';
import {GetFileDetailsEndpoint} from './types';
import {getFileDetailsJoiSchema} from './validation';

const getFileDetails: GetFileDetailsEndpoint = async instData => {
  const data = validate(instData.data, getFileDetailsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kPermissionAgentTypes);

  const file = await kSemanticModels.utils().withTxn(opts =>
    getAndCheckFileAuthorization({
      agent,
      opts,
      matcher: data,
      action: kPermissionsMap.readFile,
      incrementPresignedPathUsageCount: false,
    })
  );

  return {file: fileExtractor(file)};
};

export default getFileDetails;
