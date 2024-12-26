import "server-only";

export const googleCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(
      Buffer.from(
        process.env.GOOGLE_SERVICE_ACCOUNT_JSON!,
        "base64",
      ).toString(),
    )
  : undefined;
