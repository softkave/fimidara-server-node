export type HTTPParameterPathname = {
    filepath: string
  }

export type ReadFileEndpointQuery = {
    w: string;
h: string
  }

export type GetFileEndpointParams = {
    filepath: string;
fileId: string;
imageTranformation: ImageTransformationParams
  }