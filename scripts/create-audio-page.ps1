# Script for creating a page with 2-column grid of audio articles
# PowerShell Script - Version 2.1
# Uploads thumbnails first, then creates page with correct structure
# NO PERSIAN CHARACTERS - reads file names dynamically

param(
    [Parameter(Mandatory=$false)]
    [string]$ThumbnailFolder = "C:\Users\aiwp9\OneDrive\Desktop\adie\1",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "https://asarmulticenter.ir/api/v1",
    
    [Parameter(Mandatory=$false)]
    [string]$PageSlug = "adia",
    
    [Parameter(Mandatory=$false)]
    [string]$PageTitle = "Duas and Ziarats"
)

# Article IDs in order (matching sorted thumbnail file names)
# Thumbnails sorted alphabetically in Persian will be matched by index
$ArticleIds = @(
    "46c629df-7586-4257-b54e-4bf3605bfbc9",  # 1
    "9bac0eef-fac9-41ca-81ef-b23623736b85",  # 2
    "efbc6fa4-da0a-4a8c-81b7-f790230a0885",  # 3
    "b6b484c8-613a-48eb-8c2d-d954c0d33486",  # 4
    "a516cd38-5dcc-41ca-a373-987b57f2cd79",  # 5
    "9ade6b57-0413-42b2-8fbb-10de654d3e3c",  # 6
    "a0be466d-85aa-4966-9eea-5c9add97bc74",  # 7
    "62ed8306-aeff-4a63-9e25-92792d4cfbc6",  # 8
    "9686abe8-b340-4d2a-bdaa-63c354f49db8",  # 9
    "c92c6156-d1d2-46e2-909e-5b87a2099c9d",  # 10
    "ae6e6b98-9982-4b0d-9ff5-98c49aaa7229",  # 11
    "a87828cf-e6c5-4c21-8d72-bf46b6f41506"   # 12
)

# Show header
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Create Grid Page Script v2.1                         " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Get admin token
$Token = Read-Host "Please enter admin token"
if ([string]::IsNullOrWhiteSpace($Token)) {
    Write-Host "Token cannot be empty!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Token received!" -ForegroundColor Green
Write-Host ""

# Helper functions
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-ErrorMessage { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host $msg -ForegroundColor Yellow }

# Function to upload file and get URL
function Upload-FileToServer {
    param([string]$FilePath)
    
    $url = "$BaseUrl/file"
    $boundary = [System.Guid]::NewGuid().ToString()
    
    try {
        $fileName = [System.IO.Path]::GetFileName($FilePath)
        $fileExtension = [System.IO.Path]::GetExtension($FilePath).ToLower()
        $mimeType = switch ($fileExtension) {
            ".jpg" { "image/jpeg" }
            ".jpeg" { "image/jpeg" }
            ".png" { "image/png" }
            ".webp" { "image/webp" }
            default { "application/octet-stream" }
        }
        
        $LF = "`r`n"
        $header = "--$boundary$LF" + 
                  "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"$LF" +
                  "Content-Type: $mimeType$LF$LF"
        $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
        $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
        $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("$LF--$boundary--$LF")
        
        $ms = New-Object System.IO.MemoryStream
        $ms.Write($headerBytes, 0, $headerBytes.Length)
        $ms.Write($fileBytes, 0, $fileBytes.Length)
        $ms.Write($footerBytes, 0, $footerBytes.Length)
        $bodyBytes = $ms.ToArray()
        $ms.Close()
        
        $webRequest = [System.Net.HttpWebRequest]::Create($url)
        $webRequest.Method = "POST"
        $webRequest.ContentType = "multipart/form-data; boundary=$boundary"
        $webRequest.Headers.Add("Authorization", "Bearer $Token")
        $webRequest.ContentLength = $bodyBytes.Length
        $webRequest.Timeout = 60000
        
        $requestStream = $webRequest.GetRequestStream()
        $requestStream.Write($bodyBytes, 0, $bodyBytes.Length)
        $requestStream.Close()
        
        $response = $webRequest.GetResponse()
        $responseStream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseText = $reader.ReadToEnd()
        $reader.Close()
        $response.Close()
        
        $responseJson = $responseText | ConvertFrom-Json
        return $responseJson.result.fileAddr
    }
    catch {
        Write-ErrorMessage "  Upload failed: $($_.Exception.Message)"
        return $null
    }
}

Write-Info "Server: $BaseUrl"
Write-Info "Thumbnail folder: $ThumbnailFolder"
Write-Info "Page Slug: $PageSlug"
Write-Info ""

# Check folder exists
if (-not (Test-Path $ThumbnailFolder)) {
    Write-ErrorMessage "Thumbnail folder does not exist!"
    exit 1
}

# Get thumbnail files sorted by name
$thumbnails = Get-ChildItem -Path $ThumbnailFolder | Where-Object { $_.Extension -match "\.(jpg|jpeg|png|webp)$" } | Sort-Object Name
Write-Info "Found $($thumbnails.Count) thumbnails"
Write-Info "Article IDs count: $($ArticleIds.Count)"
Write-Info ""

# Display matching
Write-Info "File to Article ID mapping:"
for ($i = 0; $i -lt $thumbnails.Count -and $i -lt $ArticleIds.Count; $i++) {
    Write-Info "  [$i] $($thumbnails[$i].Name) -> $($ArticleIds[$i].Substring(0,8))..."
}
Write-Info ""

# Ask to continue
$continue = Read-Host "Continue? (y/n)"
if ($continue -ne "y") {
    Write-Warn "Cancelled by user"
    exit 0
}
Write-Info ""

# Step 1: Upload thumbnails and collect data
Write-Info "Step 1: Uploading thumbnails..."
Write-Info "------------------------------------------------------------"

$itemsData = @()

for ($i = 0; $i -lt $thumbnails.Count -and $i -lt $ArticleIds.Count; $i++) {
    $thumb = $thumbnails[$i]
    $articleId = $ArticleIds[$i]
    
    Write-Info "  [$($i+1)/$($thumbnails.Count)] Uploading: $($thumb.Name)"
    $imageUrl = Upload-FileToServer -FilePath $thumb.FullName
    
    if ($imageUrl) {
        Write-Success "    OK: $imageUrl"
        $itemsData += @{
            articleId = $articleId
            imageUrl = $imageUrl
        }
    } else {
        Write-Warn "    Failed, skipping"
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Info ""
Write-Info "Uploaded $($itemsData.Count) thumbnails"
Write-Info ""

# Step 2: Build layout JSON with correct structure
Write-Info "Step 2: Building layout..."
Write-Info "------------------------------------------------------------"

$rows = @()

# Group items into pairs (2 per row)
for ($i = 0; $i -lt $itemsData.Count; $i += 2) {
    $rowId = [System.Guid]::NewGuid().ToString()
    $rowItems = @()
    
    # First item
    $item1 = $itemsData[$i]
    $rowItems += @{
        type = "post"
        limit = 10
        label = ""
        link = ""
        imageUrl = $item1.imageUrl
        articleId = $item1.articleId
        style = "list"
    }
    
    # Second item (if exists)
    if (($i + 1) -lt $itemsData.Count) {
        $item2 = $itemsData[$i + 1]
        $rowItems += @{
            type = "post"
            limit = 10
            label = ""
            link = ""
            imageUrl = $item2.imageUrl
            articleId = $item2.articleId
            style = "list"
        }
    }
    
    $rows += @{
        id = $rowId
        columns = 2
        items = $rowItems
    }
}

$layoutObject = @{
    rows = $rows
}

$layoutJson = $layoutObject | ConvertTo-Json -Depth 10 -Compress
Write-Info "Created $($rows.Count) rows"
Write-Info ""

# Step 3: Create the page
Write-Info "Step 3: Creating page..."
Write-Info "------------------------------------------------------------"

$url = "$BaseUrl/admin/pages"

try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyLines = @()
    
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"slug`""
    $bodyLines += ""
    $bodyLines += $PageSlug
    
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"language`""
    $bodyLines += ""
    $bodyLines += "fa"
    
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"title`""
    $bodyLines += ""
    $bodyLines += $PageTitle
    
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"layout_json`""
    $bodyLines += ""
    $bodyLines += $layoutJson
    
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"is_active`""
    $bodyLines += ""
    $bodyLines += "true"
    
    $bodyLines += "--$boundary--"
    
    $bodyContent = $bodyLines -join $LF
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyContent)
    
    $webRequest = [System.Net.HttpWebRequest]::Create($url)
    $webRequest.Method = "POST"
    $webRequest.ContentType = "multipart/form-data; boundary=$boundary"
    $webRequest.Headers.Add("Authorization", "Bearer $Token")
    $webRequest.ContentLength = $bodyBytes.Length
    $webRequest.Timeout = 30000
    
    $requestStream = $webRequest.GetRequestStream()
    $requestStream.Write($bodyBytes, 0, $bodyBytes.Length)
    $requestStream.Close()
    
    $response = $webRequest.GetResponse()
    $responseStream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $responseText = $reader.ReadToEnd()
    $reader.Close()
    $response.Close()
    
    $responseJson = $responseText | ConvertFrom-Json
    
    Write-Info ""
    Write-Success "============================================================"
    Write-Success "PAGE CREATED SUCCESSFULLY!"
    Write-Success "============================================================"
    Write-Success "Page ID: $($responseJson.data.id)"
    Write-Success "Slug: $($responseJson.data.slug)"
    Write-Success "Rows: $($rows.Count)"
    Write-Success "Items: $($itemsData.Count)"
    Write-Info ""
    Write-Info "Access page at: $BaseUrl/pages/$PageSlug"
}
catch [System.Net.WebException] {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $errorStream = $errorResponse.GetResponseStream()
        $errorReader = New-Object System.IO.StreamReader($errorStream)
        $errorText = $errorReader.ReadToEnd()
        $errorReader.Close()
        Write-ErrorMessage ""
        Write-ErrorMessage "Error creating page: $errorText"
    } else {
        Write-ErrorMessage "Error: $($_.Exception.Message)"
    }
}
catch {
    Write-ErrorMessage "Error: $($_.Exception.Message)"
}

Write-Info ""
Write-Info "Script completed!"
