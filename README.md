# Image Recognition Service

This project is an AI-powered image classifier that utilizes AWS services such as S3, Lambda, and Rekognition to detect objects in images uploaded by users.

## Project Structure

```
image-recognition-service
├── src
│   ├── lambda_function.py          # Main AWS Lambda function
│   ├── utils
│   │   ├── __init__.py             # Initializes the utils package
│   │   ├── rekognition_helper.py    # Functions for AWS Rekognition
│   │   └── s3_helper.py             # Functions for AWS S3
│   └── tests
│       ├── __init__.py             # Initializes the tests package
│       ├── test_lambda_function.py  # Unit tests for the Lambda function
│       └── test_utils.py            # Unit tests for utility functions
├── template.yaml                    # AWS SAM template
├── requirements.txt                 # Project dependencies
├── .gitignore                       # Git ignore file
└── README.md                        # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd image-recognition-service
   ```

2. **Install dependencies:**
   Ensure you have Python and pip installed, then run:
   ```
   pip install -r requirements.txt
   ```

3. **Configure AWS Credentials:**
   Make sure your AWS credentials are configured. You can do this by running:
   ```
   aws configure
   ```

4. **Deploy the application:**
   Use the AWS SAM CLI to build and deploy the application:
   ```
   sam build
   sam deploy --guided
   ```

## Usage

- Upload an image to the specified S3 bucket.
- The upload will trigger the Lambda function, which processes the image and calls AWS Rekognition to detect labels.
- Detected labels will be stored in DynamoDB or returned via an API.

## Testing

To run the unit tests, navigate to the `src/tests` directory and run:
```
pytest
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.