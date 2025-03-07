document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const previewContainer = document.getElementById('previewContainer');
    const uploadButton = document.getElementById('uploadButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const statusText = document.getElementById('statusText');
    const resultsContainer = document.getElementById('resultsContainer');
    const noResults = document.getElementById('noResults');
    const labelResults = document.getElementById('labelResults');
    const imageDetails = document.getElementById('imageDetails');

    // Replace with your actual API endpoint after deployment
    const apiEndpoint = 'https://51snhuxc4c.execute-api.us-east-1.amazonaws.com/Prod';
    
    // Ensure loading indicator is hidden on page load
    loadingIndicator.style.display = 'none';
    
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
            
            // Reset results area
            resultsContainer.classList.add('d-none');
            noResults.style.display = 'block';
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
        // Show loading and hide results
        loadingIndicator.style.display = 'flex'; // Show now
        noResults.style.display = 'none';
        resultsContainer.classList.add('d-none');
        statusText.textContent = 'Getting upload URL...';
        
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
            statusText.textContent = 'Uploading image...';
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
            
            statusText.textContent = 'Processing image (this may take a few moments)...';
            
            // 3. Poll for results
            await pollForResults(fileName);
            
        } catch (error) {
            console.error('Error:', error);
            loadingIndicator.style.display = 'none'; // Hide on error
            showError(error.message);
        }
    }
    
    // Poll for processing results
    async function pollForResults(fileName) {
        // We'll simulate polling by fetching the list of images periodically
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
                        loadingIndicator.style.display = 'none'; // Hide when done
                        
                        // Format the results as per the required structure
                        const formattedResults = {
                            imageId: foundImage.id,
                            imageName: foundImage.image_name,
                            detectedLabels: foundImage.labels.map(label => ({
                                name: label.name,
                                confidence: label.confidence
                            })),
                            processedAt: foundImage.created_at
                        };
                        
                        displayResults(formattedResults);
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
                    loadingIndicator.style.display = 'none'; // Always hide when done
                    showError('The image is taking longer than expected to process. Please check back later.');
                }
            } catch (error) {
                console.error('Error polling for results:', error);
                loadingIndicator.style.display = 'none'; // Always hide when done
                showError(`Error checking results: ${error.message}`);
            }
        };
        
        // Start polling
        setTimeout(checkResults, 3000); // Give Lambda some time to start processing
    }
    
    // Display error message
    function showError(message) {
        resultsContainer.classList.add('d-none');
        noResults.style.display = 'block';
        noResults.innerHTML = `
            <i class="bi bi-exclamation-triangle text-danger display-1"></i>
            <p class="mt-2 text-danger">Error: ${message}</p>
        `;
    }
    
    // Display results
    function displayResults(results) {
        // Show results container and hide no results message
        resultsContainer.classList.remove('d-none');
        noResults.style.display = 'none';
        
        // Display image details
        const imageName = results.imageName.split('-').slice(1).join('-'); // Remove UUID prefix
        const processedDate = new Date(results.processedAt).toLocaleString();
        imageDetails.textContent = `ID: ${results.imageId.substring(0, 8)}... | File: ${imageName} | Processed: ${processedDate}`;
        
        // Clear previous results
        labelResults.innerHTML = '';
        
        // Sort labels by confidence - highest first
        const sortedLabels = [...results.detectedLabels].sort((a, b) => b.confidence - a.confidence);
        
        // Add each label with a confidence bar
        sortedLabels.forEach(label => {
            const confidenceValue = parseFloat(label.confidence);
            let confidenceClass = 'high-confidence';
            
            if (confidenceValue < 80) {
                confidenceClass = 'low-confidence';
            } else if (confidenceValue < 90) {
                confidenceClass = 'medium-confidence';
            }
            
            const labelElement = document.createElement('div');
            labelElement.className = 'label-item';
            labelElement.innerHTML = `
                <div class="w-100">
                    <div class="d-flex justify-content-between">
                        <span>${label.name}</span>
                        <span class="${confidenceClass}">${confidenceValue.toFixed(1)}%</span>
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-level" style="width: ${confidenceValue}%"></div>
                    </div>
                </div>
            `;
            labelResults.appendChild(labelElement);
        });
    }
    
    // Fix CSS filename issue if needed
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    cssLinks.forEach(link => {
        if (link.getAttribute('href') === 'css/styles.css') {
            link.setAttribute('href', 'css/style.css');
        }
    });
});