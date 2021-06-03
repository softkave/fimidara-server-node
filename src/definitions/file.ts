import {SessionAgentType} from './system';

export enum FileCreator {
    Transformer = 'transformer',
}

export interface IFileCreator {
    createdBy: string;
    type: FileCreator | SessionAgentType;
}

export interface IFile {
    fileId: string;
    organizationId: string;
    environmentId: string;
    projectId: string;
    bucketId: string;
    mimetype: string;
    size: number;
    createdBy: IFileCreator;
    createdAt: string;
    originalFileId?: string;
}
