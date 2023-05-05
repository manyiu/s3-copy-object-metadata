import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import {
  BundlingFileAccess,
  aws_lambda_event_sources as lambdaEventSources,
} from "aws-cdk-lib";
import * as go from "@aws-cdk/aws-lambda-go-alpha";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class S3CopyObjectMetadataStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceBucket = new s3.Bucket(this, "sourceBucket", {});
    const targetBucket = new s3.Bucket(this, "targetBucket", {});

    const copyLambda = new go.GoFunction(this, "copyLambda", {
      entry: path.join(__dirname, "../", "lambdas", "copy"),
      environment: {
        S3_SOURCE_BUCKET: sourceBucket.bucketName,
        S3_TARGET_BUCKET: targetBucket.bucketName,
      },
      architecture: lambda.Architecture.ARM_64,
    });
    sourceBucket.grantRead(copyLambda);
    targetBucket.grantWrite(copyLambda);

    const copyLambdaEventSource = new lambdaEventSources.S3EventSource(
      sourceBucket,
      {
        events: [s3.EventType.OBJECT_CREATED],
      }
    );

    copyLambda.addEventSource(copyLambdaEventSource);
  }
}
