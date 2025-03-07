import unittest
from unittest.mock import patch, MagicMock
from utils.rekognition_helper import detect_labels
from utils.s3_helper import upload_image_to_s3

class TestUtils(unittest.TestCase):

    @patch('utils.rekognition_helper.boto3.client')
    def test_detect_labels(self, mock_boto_client):
        mock_rekognition = MagicMock()
        mock_boto_client.return_value = mock_rekognition
        mock_rekognition.detect_labels.return_value = {
            'Labels': [{'Name': 'Dog'}, {'Name': 'Tree'}]
        }
        
        image_bytes = b'test_image_bytes'
        labels = detect_labels(image_bytes)
        
        self.assertEqual(labels, ['Dog', 'Tree'])
        mock_boto_client.assert_called_once_with('rekognition')
        mock_rekognition.detect_labels.assert_called_once_with(
            Image={'Bytes': image_bytes},
            MaxLabels=10,
            MinConfidence=75
        )

    @patch('utils.s3_helper.boto3.client')
    def test_upload_image_to_s3(self, mock_boto_client):
        mock_s3 = MagicMock()
        mock_boto_client.return_value = mock_s3
        
        bucket_name = 'test-bucket'
        image_name = 'test_image.jpg'
        image_bytes = b'test_image_bytes'
        
        upload_image_to_s3(bucket_name, image_name, image_bytes)
        
        mock_boto_client.assert_called_once_with('s3')
        mock_s3.put_object.assert_called_once_with(
            Bucket=bucket_name,
            Key=image_name,
            Body=image_bytes
        )

if __name__ == '__main__':
    unittest.main()