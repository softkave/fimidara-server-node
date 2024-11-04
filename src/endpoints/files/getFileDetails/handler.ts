import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {fileExtractor, getAndCheckFileAuthorization} from '../utils.js';
import {GetFileDetailsEndpoint} from './types.js';
import {getFileDetailsJoiSchema} from './validation.js';

const getFileDetails: GetFileDetailsEndpoint = async reqData => {
  const data = validate(reqData.data, getFileDetailsJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  const file = await kSemanticModels.utils().withTxn(opts =>
    getAndCheckFileAuthorization({
      agent,
      opts,
      workspaceId,
      matcher: data,
      action: kFimidaraPermissionActions.readFile,
      incrementPresignedPathUsageCount: false,
    })
  );

  return {file: fileExtractor(file)};
};

export default getFileDetails;
