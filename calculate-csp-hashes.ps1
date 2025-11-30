# Calculate CSP hashes for inline scripts and styles in HTML files
# PowerShell script to extract and hash inline <script> and <style> tags

function Calculate-Hash {
    param([string]$Content)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Content)
    $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
    $base64 = [Convert]::ToBase64String($hash)
    return "sha256-$base64"
}

function Process-HtmlFile {
    param([string]$FilePath)
    
    $scriptHashes = @()
    $styleHashes = @()
    
    try {
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        
        # Extract inline scripts (not external scripts with src=)
        $scriptPattern = '<script[^>]*>([\s\S]*?)</script>'
        $scriptMatches = [regex]::Matches($content, $scriptPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        
        foreach ($match in $scriptMatches) {
            $scriptTag = $match.Value
            $scriptContent = $match.Groups[1].Value.Trim()
            
            # Skip external scripts (those with src= attribute)
            if ($scriptContent -and $scriptTag -notmatch 'src=') {
                $hash = Calculate-Hash -Content $scriptContent
                $hashString = "'sha256-$hash'"
                if ($scriptHashes -notcontains $hashString) {
                    $scriptHashes += $hashString
                    Write-Host "Script hash for $FilePath : sha256-$hash"
                }
            }
        }
        
        # Extract inline styles
        $stylePattern = '<style[^>]*>([\s\S]*?)</style>'
        $styleMatches = [regex]::Matches($content, $stylePattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        
        foreach ($match in $styleMatches) {
            $styleContent = $match.Groups[1].Value.Trim()
            if ($styleContent) {
                $hash = Calculate-Hash -Content $styleContent
                $hashString = "'sha256-$hash'"
                if ($styleHashes -notcontains $hashString) {
                    $styleHashes += $hashString
                    Write-Host "Style hash for $FilePath : sha256-$hash"
                }
            }
        }
    }
    catch {
        Write-Host "Error processing $FilePath : $_" -ForegroundColor Red
    }
    
    return @{
        Scripts = $scriptHashes
        Styles = $styleHashes
    }
}

function Find-HtmlFiles {
    param([string]$Directory)
    
    $htmlFiles = @()
    Get-ChildItem -Path $Directory -Filter "*.html" -Recurse -File | ForEach-Object {
        # Skip node_modules and hidden directories
        if ($_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\\.') {
            $htmlFiles += $_.FullName
        }
    }
    
    return $htmlFiles
}

# Main execution
Write-Output "Calculating CSP hashes for inline scripts and styles..."
Write-Output ""

$baseDir = Get-Location
$htmlFiles = Find-HtmlFiles -Directory $baseDir

Write-Output "Found $($htmlFiles.Count) HTML files"
Write-Output ""

$allScriptHashes = @()
$allStyleHashes = @()

foreach ($file in $htmlFiles) {
    $hashes = Process-HtmlFile -FilePath $file
    $allScriptHashes += $hashes.Scripts
    $allStyleHashes += $hashes.Styles
}

# Remove duplicates
$allScriptHashes = $allScriptHashes | Select-Object -Unique | Sort-Object
$allStyleHashes = $allStyleHashes | Select-Object -Unique | Sort-Object

Write-Output ""
Write-Output "=== CSP Configuration ==="
Write-Output ""
Write-Output "script-src hashes:"
Write-Output ($allScriptHashes -join ' ')
Write-Output ""
Write-Output "style-src hashes:"
Write-Output ($allStyleHashes -join ' ')
Write-Output ""

