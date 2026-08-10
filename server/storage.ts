import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env.js";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function getS3Config() {
  const { s3Bucket, s3Region, s3Endpoint, s3AccessKeyId, s3SecretAccessKey } =
    ENV;

  if (!s3Bucket || !s3Region || !s3AccessKeyId || !s3SecretAccessKey) {
    throw new Error(
      "S3 storage is not configured. Set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY"
    );
  }

  return { s3Bucket, s3Region, s3Endpoint, s3AccessKeyId, s3SecretAccessKey };
}

function getS3Client() {
  const { s3Region, s3Endpoint, s3AccessKeyId, s3SecretAccessKey } =
    getS3Config();
  return new S3Client({
    region: s3Region,
    endpoint: s3Endpoint || undefined,
    credentials: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey,
    },
    forcePathStyle: Boolean(s3Endpoint),
  });
}

function getPublicUrl(key: string): string {
  const urlBase = ENV.s3PublicUrl?.trim() || "";
  if (urlBase) {
    return `${urlBase.replace(/\/+$/, "")}/${key}`;
  }

  const { s3Bucket, s3Region, s3Endpoint } = getS3Config();
  if (s3Endpoint) {
    return `${s3Endpoint.replace(/\/+$/, "")}/${s3Bucket}/${key}`;
  }

  return `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${key}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { s3Bucket } = getS3Config();
  const key = appendHashSuffix(normalizeKey(relKey));
  const client = getS3Client();

  const body = typeof data === "string" ? Buffer.from(data) : data;

  await client.send(
    new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return { key, url: getPublicUrl(key) };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: getPublicUrl(key) };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { s3Bucket } = getS3Config();
  const key = normalizeKey(relKey);
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: s3Bucket, Key: key });
  return await getSignedUrl(client, command, { expiresIn: 60 * 60 });
}
