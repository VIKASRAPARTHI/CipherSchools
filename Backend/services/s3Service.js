const AWS = require('aws-sdk');

// S3 service implementation
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

if (!BUCKET_NAME) {
  console.warn('AWS_BUCKET_NAME is not set. S3 operations will fail until configured.');
}

async function uploadFile(s3Key, content) {
  if (!BUCKET_NAME) throw new Error('AWS_BUCKET_NAME not configured');
  const params = {
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: typeof content === 'string' ? Buffer.from(content, 'utf8') : content,
    ContentType: 'application/octet-stream',
    ACL: 'private'
  };
  await s3.upload(params).promise();
  console.log(`Uploaded to S3: ${s3Key}`);
  return s3Key;
}

function getFileUrl(s3Key, expiresIn = 3600) {
  if (!BUCKET_NAME) throw new Error('AWS_BUCKET_NAME not configured');
  return s3.getSignedUrl('getObject', { Bucket: BUCKET_NAME, Key: s3Key, Expires: expiresIn });
}

async function downloadFile(s3Key) {
  if (!BUCKET_NAME) throw new Error('AWS_BUCKET_NAME not configured');
  const params = { Bucket: BUCKET_NAME, Key: s3Key };
  const data = await s3.getObject(params).promise();
  console.log(`Downloaded from S3: ${s3Key}`);
  return data.Body.toString('utf-8');
}

async function deleteFile(s3Key) {
  if (!BUCKET_NAME) throw new Error('AWS_BUCKET_NAME not configured');
  const params = { Bucket: BUCKET_NAME, Key: s3Key };
  await s3.deleteObject(params).promise();
  console.log(`Deleted from S3: ${s3Key}`);
}

async function deleteFiles(s3Keys = []) {
  if (!BUCKET_NAME) throw new Error('AWS_BUCKET_NAME not configured');
  if (!Array.isArray(s3Keys) || s3Keys.length === 0) return;
  const params = { Bucket: BUCKET_NAME, Delete: { Objects: s3Keys.map(k => ({ Key: k })) } };
  await s3.deleteObjects(params).promise();
  console.log(`Deleted ${s3Keys.length} files from S3`);
}

module.exports = { uploadFile, getFileUrl, downloadFile, deleteFile, deleteFiles };
