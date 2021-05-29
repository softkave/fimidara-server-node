export interface IImageSizeOption {
    width: number;
    height: number;
    size: number; // TODO: what if the size exceeds what can be stored in a number?
}

export interface IFile {
    fileId: string;
    URL: string;
    mimetype: string;
    size: number;
    imageSizeOptions?: IImageSizeOption[];
    organizationId: string;
    createdBy: string;
    createdAt: string;
    lastUpdatedBy?: string;
    lastUpdatedAt?: string;
}
