import { utapiUploadFileAdapter } from "./utapi";

type UploadFileParams = {
  file: File;
  path: string;
};

export type UploadFileAdapter = {
  uploadFile: (params: UploadFileParams) => Promise<
    | {
        error: null;
        data: {
          url: string;
        };
      }
    | {
        error: Error;
        data: null;
      }
  >;
  uploadFiles: (params: UploadFileParams[]) => Promise<
    {
      error: Error | null;
      data: {
        url: string;
      } | null;
    }[]
  >;
};

const uploadFileAdapter: UploadFileAdapter = utapiUploadFileAdapter;

export const uploadFile = async (params: UploadFileParams) => {
  const response = await uploadFileAdapter.uploadFile(params);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data.url;
};
