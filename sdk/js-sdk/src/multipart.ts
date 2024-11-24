import {kLoopAsyncSettlementType, loopAsync} from 'softkave-js-utils';
import {FimidaraEndpoints, UploadFileEndpointParams} from './indexBrowser.js';

const kMaxFileSize = 50 * 1024 * 1024 * 1024; // 50GB
const kMaxParts = 10_000;
const kMinPartSize = 10 * 1024 * 1024; // 10MB
const kMaxInMemoryBufferSize = 50 * 1024 * 1024; // 50MB

function determineMultipartParams(size: number): {
  numStreams: number;
  numParts: number;
  partSize: number;
} {
  const numParts = Math.min(kMaxParts, Math.ceil(size / kMinPartSize));
  const partSize = Math.ceil(size / numParts);
  const numStreams =
    partSize > kMaxInMemoryBufferSize
      ? 1
      : Math.ceil(size / kMaxInMemoryBufferSize);
  return {numStreams, numParts, partSize};
}

async function multipartUpload(
  params: {
    file: File;
    endpoints: FimidaraEndpoints;
  } & Pick<
    UploadFileEndpointParams,
    'description' | 'encoding' | 'mimetype' | 'fileId' | 'filepath'
  >
) {
  const {file, endpoints, ...rest} = params;
  const size = file.size;
  if (size > kMaxFileSize) {
    throw new Error(
      `File size exceeds maximum allowed size of ${kMaxFileSize} bytes`
    );
  }

  const {numStreams, numParts, partSize} = determineMultipartParams(size);

  let partIndex = 0;
  function readNext() {
    if (partIndex >= numParts) {
      return null;
    }

    const part = file.slice(partIndex * partSize, (partIndex + 1) * partSize);
    partIndex++;
    return part;
  }

  await loopAsync(
    async () => {
      let part = readNext();
      while (part?.size) {
        await endpoints.files.uploadFile({
          ...rest,
          size: part.size,
          data: part,
        });

        part = readNext();
      }
    },
    numStreams,
    kLoopAsyncSettlementType.allSettled
  );
}
