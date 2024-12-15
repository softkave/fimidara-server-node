import {IMultipartUploadParams, multipartUpload} from './multipart.js';

export interface IMultipartUploadBrowserParams
  extends Omit<IMultipartUploadParams, 'readFrom' | 'size'> {
  data: string | Blob;
  size?: number;
}

export async function multipartUploadBrowser(
  params: IMultipartUploadBrowserParams
) {
  const {data, ...rest} = params;
  const inputBlob = data instanceof Blob ? data : new Blob([data]);

  async function readFrom(start: number, end: number) {
    const blob = inputBlob.slice(start, end);
    const size = blob.size;
    return {
      size,
      data: blob,
    };
  }

  let size = params.size;
  if (!size) {
    size = inputBlob.size;
  }

  return await multipartUpload({...rest, readFrom, size});
}
