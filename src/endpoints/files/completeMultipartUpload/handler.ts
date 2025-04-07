import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {queueCompleteMultipartUploadJob} from '../../jobs/queueFns/completeMultipartUpload.js';
import {fileExtractor, getAndCheckFileAuthorization} from '../utils.js';
import {CompleteMultipartUploadEndpoint} from './types.js';
import {completeMultipartUploadJoiSchema} from './validation.js';

const completeMultipartUpload: CompleteMultipartUploadEndpoint =
  async reqData => {
    const data = validate(reqData.data, completeMultipartUploadJoiSchema);
    const agent = await kIjxUtils
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
        action: kFimidaraPermissionActions.uploadFile,
        incrementPresignedPathUsageCount: false,
      })
    );

    const job = await queueCompleteMultipartUploadJob({
      workspaceId: file.workspaceId,
      fileId: file.resourceId,
      parts: data.parts,
      agent,
      requestId: reqData.requestId,
    });

    return {file: fileExtractor(file), jobId: job.resourceId};
  };

export default completeMultipartUpload;
