const AWS = require("aws-sdk");
require("dotenv").config();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

console.log("🔍 AWS Environment Variables:");
console.log(
  "AWS_ACCESS_KEY_ID:",
  process.env.AWS_ACCESS_KEY_ID ? "✅ Set" : "❌ Undefined"
);
console.log(
  "AWS_SECRET_ACCESS_KEY:",
  process.env.AWS_SECRET_ACCESS_KEY ? "✅ Set" : "❌ Undefined"
);
console.log("AWS_REGION:", process.env.AWS_REGION || "us-east-1 (default)");

const s3 = new AWS.S3();

// Test AWS credentials source
s3.config.getCredentials((err, credentials) => {
  if (err) {
    console.log("❌ AWS Credentials Error:", err);
  } else {
    console.log("✅ AWS Credentials found!");
    console.log(
      "🔑 Access Key ID:",
      credentials.accessKeyId
        ? credentials.accessKeyId.substring(0, 4) + "..."
        : "None"
    );
    console.log("🌍 Region:", s3.config.region);
    console.log("📁 Credentials source:", credentials.constructor.name);
  }
});

module.exports = { s3 };
