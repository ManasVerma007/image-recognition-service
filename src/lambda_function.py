import json
import boto3
import urllib.parse
import uuid
from datetime import datetime
from decimal import Decimal  # Add this import

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))
    
    # Get the bucket name and object key from the event
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    print("bucket name is ", bucket_name)
    object_key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    print("object key is ", object_key)
    
    print(f"Processing bucket: {bucket_name}, key: {object_key}")
    
    try:
        # Initialize clients
        s3 = boto3.client('s3')
        rekognition = boto3.client('rekognition')
        dynamodb = boto3.resource('dynamodb')
        
        # Get the image from S3
        print("Getting image from S3...")
        response = s3.get_object(Bucket=bucket_name, Key=object_key)
        image_bytes = response['Body'].read()
        print(f"Image size: {len(image_bytes)} bytes")
        
        # Detect labels using Rekognition
        print("Calling Rekognition...")
        rekognition_response = rekognition.detect_labels(
            Image={'Bytes': image_bytes},
            MaxLabels=10,
            MinConfidence=75
        )
        
        # Extract label names and confidence scores - convert float to Decimal
        labels = []
        for label in rekognition_response['Labels']:
            labels.append({
                'name': label['Name'],
                'confidence': Decimal(str(round(label['Confidence'], 1)))  # Convert to Decimal
            })
        
        print(f"Detected labels: {labels}")
        
        # Store results in DynamoDB
        print("Saving to DynamoDB...")
        table = dynamodb.Table('ImageLabels')
        
        item_id = str(uuid.uuid4())
        item = {
            'id': item_id,
            'image_name': object_key,
            'bucket': bucket_name,
            'labels': labels,
            'created_at': datetime.now().isoformat()
        }
        
        print(f"DynamoDB item: {item}")
        table.put_item(Item=item)
        print("Successfully saved to DynamoDB")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Image processed successfully',
                'id': item_id,
                'labels': [{'name': l['name'], 'confidence': float(l['confidence'])} for l in labels]  # Convert back for JSON
            }, default=str)
        }
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise e