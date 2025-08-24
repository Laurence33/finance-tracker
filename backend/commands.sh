# Building the ft-common-layer using WSL shell before doing sam build
npm run build

# start the AWS SAM local API (API Gateway)
sam local start-api
sam local start-api --env-vars env.json


# build the AWS SAM application
sam build

# package the AWS SAM application
sam package \
  --s3-bucket laurence-code-sam-338 \
  --no-resolve-s3 \
  --output-template-file packaged.yaml

# Deploy the AWS SAM application using cloudformation
sam deploy \
  --stack-name finance-tracker-stack \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND

sam deploy \
  --stack-name finance-tracker-stack \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

# delete the AWS SAM application
sam delete --stack-name finance-tracker-stack



