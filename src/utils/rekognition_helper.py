def detect_labels(image_bytes):
    import boto3

    rekognition_client = boto3.client('rekognition')

    response = rekognition_client.detect_labels(
        Image={'Bytes': image_bytes},
        MaxLabels=10,
        MinConfidence=75
    )

    labels = [label['Name'] for label in response['Labels']]
    return labels