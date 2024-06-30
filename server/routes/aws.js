const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { isLoggedIn } = require("../middleware/auth")
const router = require('express').Router();

const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWSAccessKeyId,
        secretAccessKey: process.env.AWSSecretAccessKey
    }
})

router.post('/getObjectUrl', isLoggedIn, async (req, res) => {
    const { key } = req.body;

    if(!key) {
        return res.status(400).json({
            message: "key not found"
        });
    }

    const command = new GetObjectCommand({
        Bucket: "prephub-dev",
        Key: key
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 20 });
    
    res.json({
        url: url
    });
});

router.post('putObjectUrl', isLoggedIn, (req, res) => {
    //implementation remaining
});

module.exports = {
    awsRouter: router
}