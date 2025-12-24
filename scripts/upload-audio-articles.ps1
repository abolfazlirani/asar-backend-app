# Script for uploading audio files and creating articles
# PowerShell Script - Version 2.0
# Handles: audio files, thumbnails, and content images

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseFolder = "C:\Users\aiwp9\OneDrive\Desktop\adie",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "https://asarmulticenter.ir/api/v1",
    
    [Parameter(Mandatory=$false)]
    [string]$CategoryId = "557a1ae7-f219-4818-940a-c5f6baeea887"
)

# Folder paths
$ThumbnailFolder = Join-Path $BaseFolder "1"  # Small thumbnail images
$ContentImageFolder = Join-Path $BaseFolder "2"  # Large content images
$AudioFolder = Join-Path $BaseFolder "3"  # MP3 files

# Show header
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Audio Articles Upload Script v2.0                    " -ForegroundColor Cyan
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

Write-Info "Base folder: $BaseFolder"
Write-Info "  Thumbnails (1): $ThumbnailFolder"
Write-Info "  Content images (2): $ContentImageFolder"
Write-Info "  Audio files (3): $AudioFolder"
Write-Info "Server: $BaseUrl"
Write-Info "Category ID: $CategoryId"
Write-Info ""

# Check folders exist
if (-not (Test-Path $ThumbnailFolder)) {
    Write-ErrorMessage "Thumbnail folder '$ThumbnailFolder' does not exist!"
    exit 1
}
if (-not (Test-Path $ContentImageFolder)) {
    Write-ErrorMessage "Content image folder '$ContentImageFolder' does not exist!"
    exit 1
}
if (-not (Test-Path $AudioFolder)) {
    Write-ErrorMessage "Audio folder '$AudioFolder' does not exist!"
    exit 1
}

# List files
$mp3Files = Get-ChildItem -Path $AudioFolder -Filter "*.mp3" | Sort-Object Name
$thumbnails = Get-ChildItem -Path $ThumbnailFolder | Where-Object { $_.Extension -match "\.(jpg|jpeg|png|webp)$" } | Sort-Object Name
$contentImages = Get-ChildItem -Path $ContentImageFolder | Where-Object { $_.Extension -match "\.(jpg|jpeg|png|webp)$" } | Sort-Object Name

Write-Info "MP3 files found: $($mp3Files.Count)"
Write-Info "Thumbnail images found: $($thumbnails.Count)"
Write-Info "Content images found: $($contentImages.Count)"
Write-Info ""

# Function to upload a file and get URL
function Upload-FileToServer {
    param(
        [string]$FilePath,
        [string]$DisplayName
    )
    
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
        
        # Build multipart
        $header = "--$boundary$LF" + 
                  "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"$LF" +
                  "Content-Type: $mimeType$LF$LF"
        $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
        $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
        $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("$LF--$boundary--$LF")
        
        # Combine
        $ms = New-Object System.IO.MemoryStream
        $ms.Write($headerBytes, 0, $headerBytes.Length)
        $ms.Write($fileBytes, 0, $fileBytes.Length)
        $ms.Write($footerBytes, 0, $footerBytes.Length)
        $bodyBytes = $ms.ToArray()
        $ms.Close()
        
        # Send
        $webRequest = [System.Net.HttpWebRequest]::Create($url)
        $webRequest.Method = "POST"
        $webRequest.ContentType = "multipart/form-data; boundary=$boundary"
        $webRequest.Headers.Add("Authorization", "Bearer $Token")
        $webRequest.ContentLength = $bodyBytes.Length
        $webRequest.Timeout = 300000
        
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
        
        if ($responseJson.result.fileAddr) {
            return $responseJson.result.fileAddr
        }
        return $null
    }
    catch {
        Write-ErrorMessage "  Error uploading $DisplayName : $($_.Exception.Message)"
        return $null
    }
}

# Function to create audio article with all components
function Create-AudioArticle {
    param(
        [string]$Title,
        [string]$AudioFilePath,
        [string]$ThumbnailFilePath,
        [string]$ContentImageUrl,
        [string]$CategoryId
    )
    
    Write-Info "  Creating article: $Title"
    
    $url = "$BaseUrl/admin/articles"
    $boundary = [System.Guid]::NewGuid().ToString()
    
    # Build content HTML with image
    $contentHtml = ""
    if ($ContentImageUrl) {
        $contentHtml = "<p><img src=`"$ContentImageUrl`" data-filename=`"`"><br></p>"
    }
    
    try {
        $LF = "`r`n"
        $bodyLines = @()
        
        # Add title
        $bodyLines += "--$boundary"
        $bodyLines += "Content-Disposition: form-data; name=`"title`""
        $bodyLines += ""
        $bodyLines += $Title
        
        # Add post_type
        $bodyLines += "--$boundary"
        $bodyLines += "Content-Disposition: form-data; name=`"post_type`""
        $bodyLines += ""
        $bodyLines += "audio"
        
        # Add lang
        $bodyLines += "--$boundary"
        $bodyLines += "Content-Disposition: form-data; name=`"lang`""
        $bodyLines += ""
        $bodyLines += "fa"
        
        # Add content (HTML with image)
        if ($contentHtml) {
            $bodyLines += "--$boundary"
            $bodyLines += "Content-Disposition: form-data; name=`"content`""
            $bodyLines += ""
            $bodyLines += $contentHtml
        }
        
        # Add categoryId
        if ($CategoryId) {
            $bodyLines += "--$boundary"
            $bodyLines += "Content-Disposition: form-data; name=`"categoryId`""
            $bodyLines += ""
            $bodyLines += $CategoryId
        }
        
        $bodyStart = ($bodyLines -join $LF) + $LF
        $bodyStartBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyStart)
        
        # Audio file
        $audioFileName = [System.IO.Path]::GetFileName($AudioFilePath)
        $audioHeader = "--$boundary$LF" + 
                       "Content-Disposition: form-data; name=`"source`"; filename=`"$audioFileName`"$LF" +
                       "Content-Type: audio/mpeg$LF$LF"
        $audioHeaderBytes = [System.Text.Encoding]::UTF8.GetBytes($audioHeader)
        $audioFileBytes = [System.IO.File]::ReadAllBytes($AudioFilePath)
        $audioFooterBytes = [System.Text.Encoding]::UTF8.GetBytes($LF)
        
        # Thumbnail file
        $thumbHeaderBytes = @()
        $thumbFileBytes = @()
        $thumbFooterBytes = @()
        
        if ($ThumbnailFilePath -and (Test-Path $ThumbnailFilePath)) {
            $thumbFileName = [System.IO.Path]::GetFileName($ThumbnailFilePath)
            $thumbExtension = [System.IO.Path]::GetExtension($ThumbnailFilePath).ToLower()
            $thumbMimeType = switch ($thumbExtension) {
                ".jpg" { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".png" { "image/png" }
                ".webp" { "image/webp" }
                default { "image/jpeg" }
            }
            
            $thumbHeader = "--$boundary$LF" + 
                          "Content-Disposition: form-data; name=`"image`"; filename=`"$thumbFileName`"$LF" +
                          "Content-Type: $thumbMimeType$LF$LF"
            $thumbHeaderBytes = [System.Text.Encoding]::UTF8.GetBytes($thumbHeader)
            $thumbFileBytes = [System.IO.File]::ReadAllBytes($ThumbnailFilePath)
            $thumbFooterBytes = [System.Text.Encoding]::UTF8.GetBytes($LF)
        }
        
        $endBoundary = "--$boundary--$LF"
        $endBoundaryBytes = [System.Text.Encoding]::UTF8.GetBytes($endBoundary)
        
        # Combine all
        $ms = New-Object System.IO.MemoryStream
        $ms.Write($bodyStartBytes, 0, $bodyStartBytes.Length)
        $ms.Write($audioHeaderBytes, 0, $audioHeaderBytes.Length)
        $ms.Write($audioFileBytes, 0, $audioFileBytes.Length)
        $ms.Write($audioFooterBytes, 0, $audioFooterBytes.Length)
        
        if ($thumbFileBytes.Length -gt 0) {
            $ms.Write($thumbHeaderBytes, 0, $thumbHeaderBytes.Length)
            $ms.Write($thumbFileBytes, 0, $thumbFileBytes.Length)
            $ms.Write($thumbFooterBytes, 0, $thumbFooterBytes.Length)
        }
        
        $ms.Write($endBoundaryBytes, 0, $endBoundaryBytes.Length)
        $bodyBytes = $ms.ToArray()
        $ms.Close()
        
        # Send with progress
        $webRequest = [System.Net.HttpWebRequest]::Create($url)
        $webRequest.Method = "POST"
        $webRequest.ContentType = "multipart/form-data; boundary=$boundary"
        $webRequest.Headers.Add("Authorization", "Bearer $Token")
        $webRequest.ContentLength = $bodyBytes.Length
        $webRequest.Timeout = 300000
        $webRequest.AllowWriteStreamBuffering = $false
        
        $requestStream = $webRequest.GetRequestStream()
        
        $totalBytes = $bodyBytes.Length
        $chunkSize = 65536
        $bytesSent = 0
        $totalMB = [math]::Round($totalBytes / 1MB, 2)
        
        Write-Host "  Upload: " -NoNewline -ForegroundColor Yellow
        
        while ($bytesSent -lt $totalBytes) {
            $bytesToWrite = [Math]::Min($chunkSize, $totalBytes - $bytesSent)
            $requestStream.Write($bodyBytes, $bytesSent, $bytesToWrite)
            $bytesSent += $bytesToWrite
            
            $percent = [math]::Round(($bytesSent / $totalBytes) * 100, 0)
            $sentMB = [math]::Round($bytesSent / 1MB, 2)
            
            $filled = [math]::Floor($percent / 5)
            $empty = 20 - $filled
            $progressBar = ("#" * $filled) + ("-" * $empty)
            
            Write-Host "`r  Upload: [$progressBar] $percent% ($sentMB MB / $totalMB MB)  " -NoNewline -ForegroundColor Yellow
        }
        
        Write-Host ""
        $requestStream.Close()
        
        $response = $webRequest.GetResponse()
        $responseStream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseText = $reader.ReadToEnd()
        $reader.Close()
        $response.Close()
        
        $responseJson = $responseText | ConvertFrom-Json
        
        Write-Success "  Article created: $($responseJson.data.id)"
        return $responseJson
    }
    catch [System.Net.WebException] {
        $errorResponse = $_.Exception.Response
        if ($errorResponse) {
            $errorStream = $errorResponse.GetResponseStream()
            $errorReader = New-Object System.IO.StreamReader($errorStream)
            $errorText = $errorReader.ReadToEnd()
            $errorReader.Close()
            Write-ErrorMessage "  Error: $errorText"
        } else {
            Write-ErrorMessage "  Error: $($_.Exception.Message)"
        }
        return $null
    }
    catch {
        Write-ErrorMessage "  Error: $($_.Exception.Message)"
        return $null
    }
}

# Results arrays
$results = @()
$failed = @()

# Process each MP3 file
$counter = 0
foreach ($mp3 in $mp3Files) {
    $counter++
    Write-Info ""
    Write-Info "============================================================"
    Write-Info "[$counter/$($mp3Files.Count)] Processing: $($mp3.Name)"
    
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($mp3.Name)
    $articleTitle = $baseName -replace "_", " " -replace "  ", " "
    
    # Find matching thumbnail by EXACT name (without extension)
    $thumbnailPath = $null
    foreach ($thumb in $thumbnails) {
        $thumbBaseName = [System.IO.Path]::GetFileNameWithoutExtension($thumb.Name)
        if ($thumbBaseName -eq $baseName) {
            $thumbnailPath = $thumb.FullName
            break
        }
    }
    
    # Find matching content image that CONTAINS the audio file name
    $contentImagePath = $null
    foreach ($contentImg in $contentImages) {
        $contentBaseName = [System.IO.Path]::GetFileNameWithoutExtension($contentImg.Name)
        if ($contentBaseName -like "*$baseName*") {
            $contentImagePath = $contentImg.FullName
            break
        }
    }
    
    # Display info
    $audioSizeMB = [math]::Round($mp3.Length / 1MB, 2)
    Write-Info "  Audio: $audioSizeMB MB"
    
    if ($thumbnailPath) {
        $thumbSizeKB = [math]::Round((Get-Item $thumbnailPath).Length / 1KB, 0)
        Write-Info "  Thumbnail: $([System.IO.Path]::GetFileName($thumbnailPath)) ($thumbSizeKB KB)"
    } else {
        Write-Warn "  No thumbnail"
    }
    
    # Step 1: Upload content image first
    $contentImageUrl = $null
    if ($contentImagePath) {
        $contentSizeKB = [math]::Round((Get-Item $contentImagePath).Length / 1KB, 0)
        Write-Info "  Content image: $([System.IO.Path]::GetFileName($contentImagePath)) ($contentSizeKB KB)"
        Write-Info "  Uploading content image..."
        $contentImageUrl = Upload-FileToServer -FilePath $contentImagePath -DisplayName "content image"
        if ($contentImageUrl) {
            Write-Success "  Content image uploaded: $contentImageUrl"
        } else {
            Write-Warn "  Failed to upload content image, continuing without it"
        }
    } else {
        Write-Warn "  No content image"
    }
    
    # Step 2: Create article
    $article = Create-AudioArticle -Title $articleTitle -AudioFilePath $mp3.FullName -ThumbnailFilePath $thumbnailPath -ContentImageUrl $contentImageUrl -CategoryId $CategoryId
    
    if ($article) {
        $results += @{
            Title = $articleTitle
            ArticleId = $article.data.id
        }
    } else {
        $failed += @{
            Title = $articleTitle
        }
    }
    
    Start-Sleep -Seconds 1
}

# Final report
Write-Info ""
Write-Info "============================================================"
Write-Info "                    FINAL REPORT                            "
Write-Info "============================================================"
Write-Success "Articles created: $($results.Count)"

if ($results.Count -gt 0) {
    Write-Info ""
    Write-Success "Successful:"
    foreach ($r in $results) {
        Write-Success "  + $($r.Title) [ID: $($r.ArticleId)]"
    }
}

if ($failed.Count -gt 0) {
    Write-Info ""
    Write-ErrorMessage "Failed: $($failed.Count)"
    foreach ($f in $failed) {
        Write-ErrorMessage "  x $($f.Title)"
    }
}

Write-Info ""
Write-Info "Script completed!"
