# 通过本机 Git 凭据调用 GitHub REST API 开启 Pages（build_type: workflow）
# 用法：pwsh -File scripts/enable-pages.ps1
#       pwsh -File scripts/enable-pages.ps1 -Repo owner/repo
#
# 首次部署若遇到 "Get Pages site failed (404)"，通常是因为仓库还没有启用 Pages。
# 此脚本用 git credential 里保存的 token 直接调用 REST API，避免手动点 Settings。

param(
  [string]$Repo = ""
)

$ErrorActionPreference = "Stop"

function Get-RepoSlug {
  if ($Repo) { return $Repo }

  $remote = (git remote get-url origin 2>$null)
  if (-not $remote) {
    throw "没有找到 origin remote。请先 git remote add origin <url>，或使用 -Repo owner/name。"
  }

  $remote = $remote.Trim()
  if ($remote -match "github\.com[:/]([^/]+)/(.+?)(\.git)?$") {
    return "$($matches[1])/$($matches[2])"
  }
  throw "无法从 origin 解析 owner/repo：$remote"
}

function Get-GitHubToken {
  $input = "protocol=https`nhost=github.com`n`n"
  $raw = $input | git credential fill 2>$null
  foreach ($line in ($raw -split "`n")) {
    if ($line -match "^password=(.+)$") { return $matches[1].Trim() }
  }
  throw "未能从 git credential 读取 token。请先执行一次 git push 并登录 GitHub。"
}

$slug = Get-RepoSlug
$token = Get-GitHubToken

$headers = @{
  Authorization          = "Bearer $token"
  Accept                 = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
  "User-Agent"           = "bok-hamm-portfolio-agent"
}

$body = @{ build_type = "workflow" } | ConvertTo-Json
$base = "https://api.github.com/repos/$slug/pages"

Write-Host "→ 正在为 $slug 启用 GitHub Pages（workflow 模式）…"

try {
  $result = Invoke-RestMethod -Method Post -Uri $base -Headers $headers -Body $body -ContentType "application/json"
  Write-Host "✓ 已创建 Pages 站点：$($result.html_url)"
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  if ($status -eq 409) {
    $result = Invoke-RestMethod -Method Put -Uri $base -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "✓ Pages 已存在，已切换为 workflow 构建：$($result.html_url)"
  } elseif ($status -eq 404) {
    Write-Host "✖ 404：token 可能没有 repo/admin 权限，或仓库名不正确。"
    throw
  } else {
    throw
  }
}

Write-Host ""
Write-Host "下一步：git push origin main，等待 Actions 完成首次部署。"
Write-Host "站点地址：https://<owner>.github.io/<repo>/"
