$files = @(
    "src/lib/types.ts",
    "src/lib/permissions.ts",
    "src/context/AuthContext.tsx",
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/components/ui/Navbar.tsx",
    "src/components/ui/BottomNavigation.tsx",
    "src/components/ui/Card.tsx",
    "src/components/ui/Button.tsx",
    "src/components/ui/Skeleton.tsx",
    "src/app/home/page.tsx",
    "src/app/profile/[userId]/page.tsx",
    "src/app/profile/edit/page.tsx",
    "src/app/members/page.tsx",
    "src/app/messages/page.tsx",
    "src/app/messages/[threadId]/page.tsx",
    "src/hooks/useMessages.ts",
    "src/app/events/page.tsx",
    "src/app/events/[eventId]/page.tsx",
    "src/app/events/create/page.tsx",
    "src/app/setup/page.tsx",
    "src/components/auth/LoginForm.tsx",
    "src/components/auth/RegisterForm.tsx",
    "src/components/ui/Input.tsx",
    "src/components/ui/MessageNotification.tsx"
)

$outFile = "code_export_v2.md"
New-Item -Path $outFile -ItemType File -Force

foreach ($f in $files) {
    if (Test-Path $f) {
        Add-Content -Path $outFile -Value "`n---`n## FILE: $f`n" -Encoding UTF8
        $ext = [System.IO.Path]::GetExtension($f).TrimStart('.')
        if ($ext -eq "tsx") { $lang = "tsx" } elseif ($ext -eq "ts") { $lang = "ts" } else { $lang = "" }
        Add-Content -Path $outFile -Value "```$lang" -Encoding UTF8
        Get-Content $f | Add-Content -Path $outFile -Encoding UTF8
        Add-Content -Path $outFile -Value "```" -Encoding UTF8
    }
}
