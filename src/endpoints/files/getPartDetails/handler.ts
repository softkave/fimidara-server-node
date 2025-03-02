import {makeExtract, makeListExtract} from 'softkave-js-utils';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIkxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {getFields} from '../../../utils/extract.js';
import {validate} from '../../../utils/validate.js';
import {kEndpointConstants} from '../../constants.js';
import {getAndCheckFileAuthorization} from '../utils.js';
import {getMultipartUploadPartMetas} from '../utils/multipartUploadMeta.js';
import {GetPartDetailsEndpoint, PublicPartDetails} from './types.js';
import {getPartDetailsJoiSchema} from './validation.js';

const extractPartDetailFields = getFields<PublicPartDetails>({
  part: true,
  size: true,
});

export const partDetailsExtractor = makeExtract(extractPartDetailFields);
export const partDetailsListExtractor = makeListExtract(
  extractPartDetailFields
);

const getPartDetails: GetPartDetailsEndpoint = async reqData => {
  const data = validate(reqData.data, getPartDetailsJoiSchema);
  const agent = await kIkxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const file = await kIjxSemantic.utils().withTxn(opts =>
    getAndCheckFileAuthorization({
      agent,
      opts,
      matcher: data,
      action: kFimidaraPermissionActions.readFile,
      incrementPresignedPathUsageCount: false,
    })
  );

  if (!file.internalMultipartId) {
    return {details: []};
  }

  const {parts, continuationToken, isDone} = await getMultipartUploadPartMetas({
    multipartId: file.internalMultipartId,
    pageSize: kEndpointConstants.maxPageSize,
    cursor: data.continuationToken ? parseInt(data.continuationToken) : null,
  });

  return {
    isDone,
    continuationToken: continuationToken?.toString() || undefined,
    clientMultipartId: file.clientMultipartId || undefined,
    details: partDetailsListExtractor(parts),
  };
};

export default getPartDetails;
