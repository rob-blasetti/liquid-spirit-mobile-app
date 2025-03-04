import AWS from 'aws-sdk';
import Config from 'react-native-config';

if (!Config.AWS_ACCESS_KEY_ID || !Config.AWS_SECRET_ACCESS_KEY) {
  console.warn('Missing AWS credentials. Ensure they are set in environment variables.');
}

AWS.config.update({
  accessKeyId: Config.AWS_ACCESS_KEY_ID,
  secretAccessKey: Config.AWS_SECRET_ACCESS_KEY,
  region: Config.AWS_REGION,
});

const s3 = new AWS.S3();

export default s3;
