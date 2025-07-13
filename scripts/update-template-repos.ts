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
type GitHubRepo = Awaited<ReturnType<Octokit['search']['repos']>>['data']['items'][0]

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
    console.log('🔍 Searching for repos created from template...')

    try {
      const { data } = await this.octokit.search.repos({
        q: `template:${this.config.templateOwner}/${this.config.templateRepo}`,
        sort: 'updated',
        order: 'desc',
        per_page: this.config.options.maxRepos,
      })

      console.log(`✅ Found ${data.items.length} repos created from template`)
      return data.items
    } catch (error) {
      console.error('❌ Error searching for repos:',
        error instanceof Error ? error.message : 'Unknown error')
      return []
    }
  }

  async createUpdateBranch(owner: string, repo: string): Promise<boolean> {
    try {
      // Get main branch
      const { data: mainBranch } = await this.octokit.repos.getBranch({
        owner,
        repo,
        branch: 'master',
      })

      // Create new branch
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${this.config.branchName}`,
        sha: mainBranch.commit.sha,
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
      // Get file content from template
      const { data: templateFile } = await this.octokit.repos.getContent({
        owner: this.config.templateOwner,
        repo: this.config.templateRepo,
        path: filePath,
        ref: 'master',
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

  async createPullRequest(owner: string, repo: string): Promise<string | null> {
    try {
      const { data: pr } = await this.octokit.pulls.create({
        owner,
        repo,
        title: this.config.prTitle,
        body: this.config.prBody,
        head: this.config.branchName,
        base: 'master',
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

  async updateRepo(owner: string, repo: string): Promise<UpdateResult> {
    console.log(`\n🔄 Updating ${owner}/${repo}...`)

    try {
      // 1. Create update branch
      const branchCreated = await this.createUpdateBranch(owner, repo)
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
      const prUrl = await this.createPullRequest(owner, repo)

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

      const result = await this.updateRepo(repo.owner.login, repo.name)
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
