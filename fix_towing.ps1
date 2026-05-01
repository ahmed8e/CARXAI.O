$path = "c:\Users\amany\OneDrive\Dokumente\sas\carsafety\CARSAFETY.O\src\pages\Towing.tsx"
$content = Get-Content -Path $path -Raw -Encoding utf8

# Fix botched Skeleton comment and add SkeletonCard
$botchedSkeleton = '// "?"? Skeleton .*?// "?"? MapChooser sheet .*?\n'
$skeletonCard = @"
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-overlay p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 bg-gray-100 rounded-full w-3/4" />
          <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        </div>
      </div>
    </div>
  )
}

// ── MapChooser sheet ──────────────────────────────────────────────────
"@

$content = $content -replace $botchedSkeleton, $skeletonCard

# Remove duplicated MapChooser fragment
$duplicatedFragment = '(?s)\n\}\nfull flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-overlay text-on-surface group transition-all active:scale\[0\.98\]".*?\}\n'
$content = $content -replace $duplicatedFragment, "`n`n"

# Clean up remaining weird characters
$content = $content -replace '"?"?', "// ──"
$content = $content -replace '', " "

Set-Content -Path $path -Value $content -Encoding utf8
