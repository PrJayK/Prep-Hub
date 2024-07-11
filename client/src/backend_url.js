const env = 'DEV';
let BACKEND_URL;
if(env === 'DEV') {
    BACKEND_URL = 'localhost';
} else if(env === 'PROD') {
    BACKEND_URL = 'ec2-13-127-206-190.ap-south-1.compute.amazonaws.com';
}
export default BACKEND_URL;