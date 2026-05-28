#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-}"
if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Usage: $0 <dev|prod>"
  exit 1
fi

if [[ "$ENV" == "dev" ]]; then
  S3_BUCKET="laurence-code-sam-338"
else
  S3_BUCKET="finance-tracker-prod-sam"
fi

# build the AWS SAM application
sam build

# package the AWS SAM application
sam package \
  --s3-bucket "$S3_BUCKET" \
  --no-resolve-s3 \
  --output-template-file packaged.yaml

# Deploy the AWS SAM application using cloudformation
sam deploy \
  --stack-name finance-tracker-stack \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset
