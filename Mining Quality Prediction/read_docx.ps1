Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\user\Downloads\Weekly_Progress_Report_MinePredict_AI.docx')
$entry = $zip.GetEntry('word/document.xml')
$reader = New-Object System.IO.StreamReader($entry.Open())
$xmlStr = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$xml = [xml]$xmlStr
Write-Output $xml.DocumentElement.InnerText
