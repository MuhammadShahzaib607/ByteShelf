# Batch update color scheme: Emerald -> Modern Tech-Warehouse (Slate/Cobalt Blue/Amber)
# Run from the client directory: powershell -ExecutionPolicy Bypass -File update-theme.ps1

$extensions = @("*.tsx", "*.ts", "*.css")

foreach ($ext in $extensions) {
    Get-ChildItem -Recurse -Filter $ext | Where-Object { -not $_.FullName.Contains("node_modules") } | ForEach-Object {
        $path = $_.FullName
        $content = Get-Content $path -Raw
        $original = $content
        
        # Replace emerald theme colors with tech-warehouse palette
        $content = $content -replace '#ECFDF5', '#F8FAFC'   # Emerald 50 -> Slate 50
        $content = $content -replace '#064E3B', '#1E293B'   # Emerald 900 -> Steel Gray
        $content = $content -replace '#059669', '#0284C7'   # Emerald 600 -> Cobalt Blue
        $content = $content -replace '#121212', '#0F172A'   # Off-black -> Slate 900
        $content = $content -replace 'shadow-emerald-900', 'shadow-slate-900'  # Shadow color
        
        if ($content -ne $original) {
            Set-Content $path -Value $content -NoNewline
            Write-Host "Updated: $path"
        }
    }
}

Write-Host "Theme update complete!"
