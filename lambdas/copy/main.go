package main

import (
	"context"
	"os"
	"sync"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

func handleS3Record(ctx context.Context, wg *sync.WaitGroup, client *s3.Client, record events.S3EventRecord) {
	client.CopyObject(ctx, &s3.CopyObjectInput{
		CopySource: aws.String(os.Getenv("S3_SOURCE_BUCKET") + "/" + record.S3.Object.Key),
		Bucket:     aws.String(os.Getenv("S3_TARGET_BUCKET")),
		Key:        aws.String(record.S3.Object.Key),
		Metadata: map[string]string{
			"source": record.S3.Bucket.Name,
			"test":   "true",
		},
		MetadataDirective: types.MetadataDirectiveReplace,
	})

	wg.Done()
}

func HandleRequest(ctx context.Context, event events.S3Event) {
	cfg, _ := config.LoadDefaultConfig(ctx)
	client := s3.NewFromConfig(cfg)

	var wg sync.WaitGroup

	for _, record := range event.Records {
		wg.Add(1)
		go handleS3Record(ctx, &wg, client, record)
	}

	wg.Wait()
}

func main() {
	lambda.Start(HandleRequest)
}
