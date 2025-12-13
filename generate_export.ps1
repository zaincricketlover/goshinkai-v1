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

$output = ""
foreach ($file in $files) {
    if (Test-Path $file) {
        $output += "`n---`n## FILE: $file`n`n"
        $ext = [System.IO.Path]::GetExtension($file).TrimStart('.')
        if ($ext -eq "tsx") { $lang = "tsx" } elseif ($ext -eq "ts") { $lang = "ts" } else { $lang = "" }
        $output += "```$lang`n"
        $content = Get-Content $file -Raw
        $output += $content
        $output += "`n```"
    }
}
$output | Out-File -Encoding UTF8 code_export_v2.md
