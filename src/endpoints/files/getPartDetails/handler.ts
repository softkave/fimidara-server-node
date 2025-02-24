import {makeExtract, makeListExtract} from 'softkave-js-utils';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {PublicFilePart} from '../../../definitions/file.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {getFields} from '../../../utils/extract.js';
import {validate} from '../../../utils/validate.js';
import {InvalidRequestError} from '../../errors.js';
import {getEndpointPageFromInput} from '../../pagination.js';
import {getAndCheckFileAuthorization} from '../utils.js';
import {getMultipartUploadPartMetas} from '../utils/multipartUploadMeta.js';
import {GetPartDetailsEndpoint} from './types.js';
import {getPartDetailsJoiSchema} from './validation.js';

const extractPartDetailFields = getFields<PublicFilePart>({
  part: true,
  partId: true,
  size: true,
});

export const partDetailsExtractor = makeExtract(extractPartDetailFields);
export const partDetailsListExtractor = makeListExtract(
  extractPartDetailFields
);

const getPartDetails: GetPartDetailsEndpoint = async reqData => {
  const data = validate(reqData.data, getPartDetailsJoiSchema);
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
      shouldIngestFile: false,
    })
  );

  if (!file.multipartId) {
    return {parts: []};
  }

  if (data.multipartId && data.multipartId !== file.multipartId) {
    throw new InvalidRequestError(
      'Input multipartId does not match file multipartId'
    );
  }

  const multipartId = data.multipartId || file.multipartId;
  appAssert(multipartId, new InvalidRequestError('MultipartId is required'));
  const parts = await getMultipartUploadPartMetas({
    ...data,
    multipartId,
  });

  return {
    multipartId,
    page: getEndpointPageFromInput(data),
    parts: partDetailsListExtractor(parts),
  };
};

export default getPartDetails;
