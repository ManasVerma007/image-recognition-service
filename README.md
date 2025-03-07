# Image Recognition Service

This project is an AI-powered image classifier that utilizes AWS services such as S3, Lambda, and Rekognition to detect objects in images uploaded by users.

## Live Demo

You can try the application live at:
[https://image-recognition-service.vercel.app/](https://image-recognition-service.vercel.app/)

## Features

- **Object Detection**: Identify objects, scenes, concepts, and activities in your images
- **Confidence Scoring**: See how confident the AI is about each detection
- **Real-Time Processing**: Upload and get results within seconds
- **Serverless Architecture**: Built on AWS Lambda for scalability

## Usage

1. Navigate to the [application](https://image-recognition-service.vercel.app/)
2. Click "Try It" or go to the [prediction page](https://image-recognition-service.vercel.app/prediction.html)
3. Upload an image by clicking or dropping a file
4. View the detected objects and their confidence scores

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: AWS Lambda (Python)
- **Image Processing**: AWS Rekognition
- **Storage**: Amazon S3, DynamoDB
- **API**: Amazon API Gateway
- **Hosting**: Vercel
