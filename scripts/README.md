# 🔄 Automatic Template Repos Update Script

This script allows you to automatically update all repos that were created from your GitHub template by creating Pull Requests.

## 🚀 Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
```bash
# Create a GitHub token with repo permissions
export TOKEN="ghp_your_token_here"
export TEMPLATE_OWNER="your-username"
export TEMPLATE_REPO="your-template"
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
5. **Summary**: Displays an operations report

## 📊 Example output

```
🚀 Starting automatic template repos update
📋 Template: your-username/your-template

🔍 Searching for repos created from template...
✅ Found 5 repos created from template

🔄 Updating user1/repo1...
✅ Branch update-from-template created for user1/repo1
  📝 client/components/atoms/PWAButton.tsx updated
  ✅ middleware.ts already up to date
✅ Files updated for user1/repo1
✅ Pull Request created: https://github.com/user1/repo1/pull/123

📊 Update summary:
==================================================
✅ Success: 5
  - user1/repo1: https://github.com/user1/repo1/pull/123
  - user2/repo2: https://github.com/user2/repo2/pull/45

🎉 Update completed! 5/5 repos updated
```

## 🔐 Security

### Required GitHub token
The script requires a GitHub token with the following permissions:
- `repo`: To access private repos
- `public_repo`: To access public repos

### Creating the token
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the `repo` and `public_repo` scopes
4. Copy the token and use it as an environment variable

## 🚨 Limitations

- **API Rate Limits**: GitHub limits API requests to 5000/hour for authenticated accounts
- **Permissions**: The script can only update repos where you have write access
- **Conflicts**: Merge conflicts must be resolved manually
- **iOS**: iOS repos require manual instructions (no `beforeinstallprompt` event)

## 🔄 Automation

### GitHub Actions
Create a workflow to run the script automatically:

```yaml
# .github/workflows/update-template-repos.yml
name: Update Template Repos

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday

jobs:
  update-repos:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run update-template-repos
        env:
          TOKEN: ${{ secrets.TOKEN }}
          TEMPLATE_OWNER: ${{ github.repository_owner }}
          TEMPLATE_REPO: ${{ github.event.repository.name }}
```

### Local cron job
```bash
# Add to your crontab
0 9 * * 1 cd /path/to/your/template && npm run update-template-repos
```

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

### Branch already exists
- The script automatically handles existing branches
- Manually delete the branch if necessary

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
