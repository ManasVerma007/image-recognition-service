import json
import boto3
import os
import uuid
import urllib.parse
from botocore.exceptions import ClientError

def decimal_converter(obj):
    """Helper method to convert Decimal types to float for JSON serialization"""
    from decimal import Decimal
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def get_presigned_url(event, context):
    """Generate a presigned URL for uploading images to S3"""
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        file_name = query_params.get('fileName')
        file_type = query_params.get('fileType')
        
        if not file_name or not file_type:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'fileName and fileType are required'})
            }
        
        # Generate a unique file name to avoid conflicts
        unique_file_name = f"{uuid.uuid4()}-{file_name}"
        
        # Get bucket name from environment variable
        bucket_name = os.environ.get('BUCKET_NAME')
        
        # Create S3 client
        s3_client = boto3.client('s3')
        
        # Generate presigned URL for upload
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': unique_file_name,
                'ContentType': file_type
            },
            ExpiresIn=300  # URL expires in 5 minutes
        )
        
        # Return the URL and the generated file name
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'uploadUrl': presigned_url,
                'fileName': unique_file_name
            })
        }
    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }

def get_results(event, context):
    """Get image recognition results from DynamoDB"""
    try:
        # Get path parameters
        path_params = event.get('pathParameters', {}) or {}
        image_id = path_params.get('imageId')
        
        if not image_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'imageId is required'})
            }
        
        # Get table name from environment variable
        table_name = os.environ.get('TABLE_NAME')
        
        # Create DynamoDB resource
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)
        
        # Get item from DynamoDB
        response = table.get_item(Key={'id': image_id})
        
        # Check if item exists
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Image not found'})
            }
        
        # Return the item
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(response['Item'], default=decimal_converter)
        }
    except Exception as e:
        print(f"Error getting results: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }

def list_images(event, context):
    """List all processed images"""
    try:
        # Get table name from environment variable
        table_name = os.environ.get('TABLE_NAME')
        
        # Create DynamoDB resource
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)
        
        # Scan the table to get all items
        response = table.scan()
        items = response.get('Items', [])
        
        # Return the items
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'images': items}, default=decimal_converter)
        }
    except Exception as e:
        print(f"Error listing images: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }
