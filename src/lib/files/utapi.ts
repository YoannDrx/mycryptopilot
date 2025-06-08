import { UTApi } from "uploadthing/server";
import type { UploadFileAdapter } from "./upload-file";

export const utapi = new UTApi({});

export const utapiUploadFileAdapter: UploadFileAdapter = {
  uploadFile: async (params) => {
    const response = await utapi.uploadFiles([params.file]);

    if (response[0].error) {
      return { error: new Error(response[0].error.message), data: null };
    }

    return { error: null, data: { url: response[0].data.ufsUrl } };
  },
  uploadFiles: async (params) => {
    const response = await utapi.uploadFiles(params.map((param) => param.file));

    return response.map((response) => {
      if (response.error) {
        return { error: new Error(response.error.message), data: null };
      }

      return { error: null, data: { url: response.data.ufsUrl } };
    });
  },
};
