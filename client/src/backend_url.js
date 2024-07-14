const env = 'DEV';
let BACKEND_URL;
if(env === 'DEV') {
    BACKEND_URL = 'localhost';
} else if(env === 'PROD') {
    BACKEND_URL = '';
}
export { BACKEND_URL };