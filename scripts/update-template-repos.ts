#!/usr/bin/env ts-node

/**
 * Automatic template repos update script
 *
 * This script:
 * 1. Finds all repos created from your template
 * 2. Creates Pull Requests to update them
 * 3. Notifies repo owners
 *
 * Usage: npx ts-node scripts/update-template-repos.ts
 */

import { Octokit } from '@octokit/rest'

import { config } from './update-template-repos.config'

// Types for GitHub API - using official Octokit types
type GitHubRepo = Awaited<ReturnType<Octokit['repos']['get']>>['data']

interface UpdateResult {
  repo: string
  prUrl: string | null
  success: boolean
  error?: string
}

interface TemplateFile {
  path: string
  content: string
  sha: string
  encoding: string
}

class TemplateUpdater {
  private octokit: Octokit
  private config: typeof config

  constructor() {
    if (!config.githubToken) {
      throw new Error('TOKEN environment variable is required')
    }

    this.config = config
    this.octokit = new Octokit({
      auth: config.githubToken,
    })
  }

  async findTemplateForks(): Promise<GitHubRepo[]> {
    console.log('🔍 Getting repos from manual configuration...')

    try {
      const repos: GitHubRepo[] = []

      for (const repoConfig of this.config.reposToUpdate) {
        try {
          const { data: repo } = await this.octokit.repos.get({
            owner: repoConfig.owner,
            repo: repoConfig.name,
          })
          repos.push(repo)
        } catch (error: any) {
          if (error.status === 404) {
            console.log(`⚠️  Repo ${repoConfig.owner}/${repoConfig.name} not found`)
          } else {
            console.error(
              `❌ Error accessing ${repoConfig.owner}/${repoConfig.name}:`,
              error.message,
            )
          }
        }
      }

      console.log(`✅ Found ${repos.length} repos from configuration`)
      return repos
    } catch (error) {
      console.error('❌ Error getting repos:',
        error instanceof Error ? error.message : 'Unknown error')
      return []
    }
  }

  async createUpdateBranch(owner: string, repo: string, sourceBranch: string = 'dev'): Promise<boolean> {
    try {
      // Use dev branch as source (since PRs go to dev, not master)
      // This avoids workflow rules that block branches created from master
      const { data: sourceBranchData } = await this.octokit.repos.getBranch({
        owner,
        repo,
        branch: sourceBranch,
      })

      // Create new branch
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${this.config.branchName}`,
        sha: sourceBranchData.commit.sha,
      })

      console.log(`✅ Branch ${this.config.branchName} created for ${owner}/${repo}`)
      return true
    } catch (error: any) {
      if (error.status === 422) {
        console.log(`⚠️  Branch ${this.config.branchName} already exists for ${owner}/${repo}`)
        return true
      }
      console.error(`❌ Error creating branch for ${owner}/${repo}:`, error.message)
      return false
    }
  }

  async updateFiles(owner: string, repo: string): Promise<boolean> {
    try {
      // Update files in repo
      for (const filePath of this.config.filesToUpdate) {
        await this.updateFile(owner, repo, filePath)

        // Delay between requests to avoid rate limits
        if (this.config.options.requestDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.config.options.requestDelay))
        }
      }

      console.log(`✅ Files updated for ${owner}/${repo}`)
      return true
    } catch (error) {
      console.error(`❌ Error updating files for ${owner}/${repo}:`,
        error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  async updateFile(owner: string, repo: string, filePath: string): Promise<void> {
    try {
      // Get file content from template (use dev branch where changes are made)
      const { data: templateFile } = await this.octokit.repos.getContent({
        owner: this.config.templateOwner,
        repo: this.config.templateRepo,
        path: filePath,
        ref: 'dev',
      }) as { data: TemplateFile }

      // Get current file content in repo
      const { data: currentFile } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: this.config.branchName,
      }) as { data: TemplateFile }

      // Compare contents
      if (templateFile.sha !== currentFile.sha) {
        // Update file
        await this.octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: filePath,
          message: `🔄 Update ${filePath} from template`,
          content: templateFile.content,
          sha: currentFile.sha,
          branch: this.config.branchName,
        })

        console.log(`  📝 ${filePath} updated`)
      } else {
        console.log(`  ✅ ${filePath} already up to date`)
      }
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`  ⚠️  ${filePath} doesn't exist in repo`)
      } else {
        console.error(`  ❌ Error updating ${filePath}:`, error.message)
      }
    }
  }

  async createPullRequest(owner: string, repo: string, prBaseBranch?: string): Promise<string | null> {
    try {
      // Use prBaseBranch if specified, otherwise default to 'dev' (since master has branch protection)
      const baseBranch = prBaseBranch || 'dev'

      const { data: pr } = await this.octokit.pulls.create({
        owner,
        repo,
        title: this.config.prTitle,
        body: this.config.prBody,
        head: this.config.branchName,
        base: baseBranch,
      })

      console.log(`✅ Pull Request created: ${pr.html_url}`)
      return pr.html_url
    } catch (error: any) {
      if (error.status === 422) {
        console.log(`⚠️  Pull Request already exists for ${owner}/${repo}`)
        return null
      }
      console.error(`❌ Error creating PR for ${owner}/${repo}:`, error.message)
      return null
    }
  }

  async updateRepo(owner: string, repo: string, prBaseBranch?: string): Promise<UpdateResult> {
    console.log(`\n🔄 Updating ${owner}/${repo}...`)

    try {
      // 1. Create update branch (use dev as source since PRs go to dev)
      const sourceBranch = prBaseBranch || 'dev'
      const branchCreated = await this.createUpdateBranch(owner, repo, sourceBranch)
      if (!branchCreated) {
        return {
          repo: `${owner}/${repo}`,
          prUrl: null,
          success: false,
          error: 'Failed to create branch',
        }
      }

      // 2. Update files
      const filesUpdated = await this.updateFiles(owner, repo)
      if (!filesUpdated) {
        return {
          repo: `${owner}/${repo}`,
          prUrl: null,
          success: false,
          error: 'Failed to update files',
        }
      }

      // 3. Create Pull Request
      const prUrl = await this.createPullRequest(owner, repo, prBaseBranch)

      return {
        repo: `${owner}/${repo}`,
        prUrl,
        success: !!prUrl,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Error updating ${owner}/${repo}:`, errorMessage)
      return {
        repo: `${owner}/${repo}`,
        prUrl: null,
        success: false,
        error: errorMessage,
      }
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting automatic template repos update')
    console.log(`📋 Template: ${this.config.templateOwner}/${this.config.templateRepo}`)

    if (this.config.options.debug) {
      console.log('🐛 Debug mode enabled')
    }

    // Find repos
    const repos = await this.findTemplateForks()

    if (repos.length === 0) {
      console.log('❌ No repos found')
      return
    }

    const results: UpdateResult[] = []

    // Update each repo
    for (const repo of repos) {
      // Check that owner is not null
      if (!repo.owner) {
        console.log(`⚠️  Repo ${repo.full_name} has no owner, skipping`)
        continue
      }

      // Find the corresponding config to get prBaseBranch
      const repoConfig = this.config.reposToUpdate.find(
        (r) => r.owner === repo.owner.login && r.name === repo.name
      )
      const prBaseBranch = repoConfig?.prBaseBranch

      const result = await this.updateRepo(repo.owner.login, repo.name, prBaseBranch)
      results.push(result)

      // Delay between repos to avoid rate limits
      if (this.config.options.requestDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.config.options.requestDelay))
      }
    }

    // Display summary
    this.displaySummary(results)
  }

  private displaySummary(results: UpdateResult[]): void {
    console.log('\n📊 Update summary:')
    console.log('='.repeat(50))

    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)

    console.log(`✅ Success: ${successful.length}`)
    successful.forEach((r) => {
      console.log(`  - ${r.repo}: ${r.prUrl}`)
    })

    if (failed.length > 0) {
      console.log(`\n❌ Failures: ${failed.length}`)
      failed.forEach((r) => {
        console.log(`  - ${r.repo}: ${r.error}`)
      })
    }

    console.log(`\n🎉 Update completed! ${successful.length}/${results.length} repos updated`)
  }
}

// Script execution
async function main(): Promise<void> {
  try {
    const updater = new TemplateUpdater()
    await updater.run()
  } catch (error) {
    console.error('❌ Fatal error:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { type GitHubRepo,TemplateUpdater, type UpdateResult }
