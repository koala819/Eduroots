# 🔄 Automatic Template Repos Update Script

This script allows you to automatically update all repos that were created from your GitHub template by creating Pull Requests.

## 🚀 Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
```bash
# Create a GitHub token with extended permissions
export TOKEN="ghp_your_token_here"
export TEMPLATE_OWNER="your-username"
export TEMPLATE_REPO="your-template"
export BYPASS_PROTECTION="true"  # Enable auto-merge
```

## 📋 Usage

### Simple execution
```bash
npm run update-template-repos
```

### Execution with debug
```bash
DEBUG=true npm run update-template-repos
```

### Manual execution
```bash
npx ts-node scripts/update-template-repos.ts
```

## ⚙️ Configuration

Modify the `scripts/update-template-repos.config.ts` file to customize:

- **Files to update**: List of template files to synchronize
- **PR message**: Description of changes in Pull Requests
- **Advanced options**: Delays, limits, etc.

## 🔧 How it works

The script performs the following steps for each repo:

1. **Search**: Finds all repos created from the template
2. **Branch**: Creates an `update-from-template` branch
3. **Synchronization**: Updates files from the template
4. **Pull Request**: Creates a PR with the changes
5. **Auto-merge**: Automatically merges the PR (if bypass protection is enabled)
6. **Summary**: Displays an operations report

## 📊 Example output

```
🚀 Starting automatic template repos update
📋 Template: your-username/your-template
🔑 Token configured: Yes
🛡️ Bypass protection: Yes

🔄 Updating user1/repo1...
✅ Branch update-from-template created for user1/repo1
  📝 client/components/atoms/PWAButton.tsx updated
  ✅ middleware.ts already up to date
✅ Files updated for user1/repo1
✅ Pull Request created: https://github.com/user1/repo1/pull/123
🔄 Auto-merge enabled for PR #123
✅ PR #123 auto-merged successfully
🧹 Branch update-from-template cleaned up

📊 Update summary:
==================================================
✅ Success: 5
  - user1/repo1
  - user2/repo2

🎉 Update completed! 5/5 repos updated
```

## 🔐 Security

### Required GitHub token permissions

The script requires a GitHub token with **extended permissions** to bypass branch protection rules:

#### For basic functionality:
- `repo`: To access private repos
- `public_repo`: To access public repos

#### For auto-merge (bypass protection):
- `repo`: Full repository access
- `admin:org`: Organization administration (if updating org repos)
- `workflow`: Workflow permissions

### Creating the token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the following scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `public_repo` (Access public repositories)
   - ✅ `admin:org` (Full control of organizations and teams)
   - ✅ `workflow` (Update GitHub Action workflows)
4. Copy the token and use it as an environment variable

### ⚠️ Important Security Notes

- **Token Security**: Keep your token secure and never commit it to version control
- **Scope Limitation**: Use the minimum required permissions for your use case
- **Regular Rotation**: Rotate your token regularly for security
- **Organization Tokens**: For organization repos, consider using GitHub Apps instead

## 🛡️ Bypass Protection Feature

The script includes a `bypassProtection` option that allows automatic merging of Pull Requests, even when branch protection rules are enabled.

### How it works:

1. **Creates PR**: Normal Pull Request creation
2. **Enables Auto-merge**: Uses GitHub's auto-merge feature
3. **Waits and Merges**: Automatically merges after a short delay
4. **Cleans Up**: Removes the temporary branch

### Configuration:

```bash
# Enable bypass protection
export BYPASS_PROTECTION="true"

# Or disable it
export BYPASS_PROTECTION="false"
```

### GitHub Actions:

```yaml
env:
  BYPASS_PROTECTION: ${{ github.event.inputs.bypass_protection == 'true' || 'true' }}
```

## 🚨 Limitations

- **API Rate Limits**: GitHub limits API requests to 5000/hour for authenticated accounts
- **Permissions**: The script can only update repos where you have write access
- **Conflicts**: Merge conflicts must be resolved manually
- **iOS**: iOS repos require manual instructions (no `beforeinstallprompt` event)
- **Branch Protection**: Some very strict protection rules may still block auto-merge

## 🐛 Troubleshooting

### Error "TOKEN environment variable is required"
```bash
export TOKEN="your_token_here"
```

### "Not Found" error for some repos
- Check that the token has the correct permissions
- Private repos require the `repo` scope

### Rate limit reached
- Wait for the quota to renew (5000/hour)
- Use a token with more permissions

### Auto-merge fails
- Check that the token has `admin:org` permissions
- Verify branch protection rules allow auto-merge
- Some protection rules cannot be bypassed (e.g., required reviews from specific users)

### Permission denied errors
- Ensure the token has sufficient scope
- For organization repos, the token owner must have admin access
- Check repository settings and branch protection rules

## 📝 Important notes

- **Test first**: Run the script on a test repo
- **Backup**: Target repos are not modified directly (only via PR)
- **Communication**: Inform template users about automatic updates
- **Documentation**: Keep this README updated with new features

## 🤝 Contributing

To improve the script:

1. Fork the repo
2. Create a branch for your feature
3. Test with `npm test`
4. Create a Pull Request

## 📄 License

This script is under the same license as the main project.
