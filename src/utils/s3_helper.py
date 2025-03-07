def upload_image_to_s3(bucket_name, image_name, image_bytes):
    import boto3
    from botocore.exceptions import NoCredentialsError, ClientError

    s3_client = boto3.client('s3')

    try:
        s3_client.put_object(Bucket=bucket_name, Key=image_name, Body=image_bytes)
        return True
    except NoCredentialsError:
        print("Credentials not available")
        return False
    except ClientError as e:
        print(f"Failed to upload image to S3: {e}")
        return False