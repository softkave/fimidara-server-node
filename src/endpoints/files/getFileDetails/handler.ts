import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {fileExtractor, getAndCheckFileAuthorization} from '../utils.js';
import {GetFileDetailsEndpoint} from './types.js';
import {getFileDetailsJoiSchema} from './validation.js';

const getFileDetails: GetFileDetailsEndpoint = async reqData => {
  const data = validate(reqData.data, getFileDetailsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const file = await kSemanticModels.utils().withTxn(opts =>
    getAndCheckFileAuthorization({
      agent,
      opts,
      matcher: data,
      action: kFimidaraPermissionActions.readFile,
      incrementPresignedPathUsageCount: false,
    })
  );

  return {file: fileExtractor(file)};
};

export default getFileDetails;
