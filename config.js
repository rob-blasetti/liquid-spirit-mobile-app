import Config from 'react-native-config';

//Set the API URL
// export const API_URL = Config.DEV_API;
export const API_URL = 'http://192.168.1.119:5005';

console.log(API_URL);

export const AWS_ID = Config.AWS_ACCESS_KEY_ID;
export const AWS_Secret = Config.AWS_SECRET_ACCESS_KEY;
export const AWS_Region = Config.AWS_REGION;