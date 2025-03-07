import unittest
from unittest.mock import patch, MagicMock
import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lambda_function import lambda_handler

class TestLambdaFunction(unittest.TestCase):

    @patch('lambda_function.boto3.client')
    @patch('lambda_function.boto3.resource')
    @patch('lambda_function.detect_labels')
    def test_lambda_handler(self, mock_detect_labels, mock_boto_resource, mock_boto_client):
        # Mock S3 client
        mock_s3 = MagicMock()
        mock_boto_client.return_value = mock_s3
        mock_s3.get_object.return_value = {
            'Body': MagicMock(read=lambda: b'test_image_bytes')
        }
        
        # Mock DynamoDB resource and table
        mock_table = MagicMock()
        mock_dynamodb = MagicMock()
        mock_boto_resource.return_value = mock_dynamodb
        mock_dynamodb.Table.return_value = mock_table
        
        # Mock Rekognition response
        mock_detect_labels.return_value = ['Dog', 'Tree']
        
        # Test event
        event = {
            'Records': [
                {
                    's3': {
                        'bucket': {
                            'name': 'test-bucket'
                        },
                        'object': {
                            'key': 'test-image.jpg'
                        }
                    }
                }
            ]
        }
        
        context = {}
        
        # Call the function
        response = lambda_handler(event, context)
        
        # Assert S3 client was called
        mock_boto_client.assert_called_once_with('s3')
        mock_s3.get_object.assert_called_once_with(
            Bucket='test-bucket',
            Key='test-image.jpg'
        )
        
        # Assert labels were detected
        mock_detect_labels.assert_called_once_with(b'test_image_bytes')
        
        # Assert DynamoDB Table was called
        mock_dynamodb.Table.assert_called_once_with('ImageLabels')
        mock_table.put_item.assert_called_once()
        
        # Assert response is correct
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['labels'], ['Dog', 'Tree'])

if __name__ == '__main__':
    unittest.main()