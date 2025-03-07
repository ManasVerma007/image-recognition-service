document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const previewContainer = document.getElementById('previewContainer');
    const uploadButton = document.getElementById('uploadButton');
    const resultsArea = document.getElementById('results');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Replace with your actual API endpoint after deployment
    // You will get this URL from the SAM deployment output
    const apiEndpoint = 'https://51snhuxc4c.execute-api.us-east-1.amazonaws.com/Prod';
    
    // Drop area event listeners
    dropArea.addEventListener('click', () => fileInput.click());
    
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('bg-light');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('bg-light');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('bg-light');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            displayImagePreview(e.dataTransfer.files[0]);
        }
    });
    
    // File input change event
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            displayImagePreview(fileInput.files[0]);
        }
    });
    
    // Display image preview
    function displayImagePreview(file) {
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
    
    // Upload button click event
    uploadButton.addEventListener('click', () => {
        if (!fileInput.files.length) {
            alert('Please select an image first');
            return;
        }
        
        uploadImage(fileInput.files[0]);
    });
    
    // Upload image to S3
    async function uploadImage(file) {
        loadingIndicator.style.display = 'block';
        resultsArea.textContent = 'Getting upload URL...';
        
        try {
            // 1. Get a pre-signed URL from our API Gateway
            const urlResponse = await fetch(`${apiEndpoint}/get-upload-url?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`);
            
            if (!urlResponse.ok) {
                throw new Error(`Failed to get upload URL: ${urlResponse.statusText}`);
            }
            
            const urlData = await urlResponse.json();
            const uploadUrl = urlData.uploadUrl;
            const fileName = urlData.fileName;
            
            // 2. Upload to S3 using the pre-signed URL
            resultsArea.textContent = 'Uploading image...';
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });
            
            if (!uploadResponse.ok) {
                throw new Error(`Failed to upload to S3: ${uploadResponse.statusText}`);
            }
            
            resultsArea.textContent = 'Image uploaded! Processing (this may take a few moments)...';
            
            // 3. Poll for results
            await pollForResults(fileName);
            
        } catch (error) {
            console.error('Error:', error);
            loadingIndicator.style.display = 'none';
            resultsArea.textContent = `Error: ${error.message}`;
        }
    }
    
    // Poll for processing results
    async function pollForResults(fileName) {
        // We'll simulate polling by fetching the list of images periodically
        // and looking for our image name
        let attempts = 0;
        const maxAttempts = 20; // 20 * 1.5s = 30s maximum wait time
        
        const checkResults = async () => {
            try {
                // Get the list of processed images
                const response = await fetch(`${apiEndpoint}/images`);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Look for our image in the results
                    const foundImage = data.images.find(img => img.image_name === fileName);
                    
                    if (foundImage) {
                        // We found our image with results!
                        loadingIndicator.style.display = 'none';
                        displayResults(foundImage);
                        return;
                    }
                }
                
                // If we haven't found results yet
                attempts++;
                if (attempts < maxAttempts) {
                    // Try again after a delay
                    setTimeout(checkResults, 1500);
                } else {
                    // Give up after max attempts
                    loadingIndicator.style.display = 'none';
                    resultsArea.textContent = 'The image is taking longer than expected to process. Please check back later.';
                }
            } catch (error) {
                console.error('Error polling for results:', error);
                loadingIndicator.style.display = 'none';
                resultsArea.textContent = `Error checking results: ${error.message}`;
            }
        };
        
        // Start polling
        setTimeout(checkResults, 3000); // Give Lambda some time to start processing
    }
    
    // Display results
    function displayResults(results) {
        // Format the results nicely
        const formattedOutput = {
            imageId: results.id,
            imageName: results.image_name,
            detectedLabels: results.labels,
            processedAt: results.created_at
        };
        
        resultsArea.textContent = JSON.stringify(formattedOutput, null, 2);
    }
});