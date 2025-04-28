import re
import json
from git import Repo
import logging

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('update_readme.log')
    ]
)

def get_latest_version(content):
    version_match = re.search(r'!\[Version\]\(https://img\.shields\.io/badge/version-(\d+\.\d+\.\d+)-blue\.svg\)', content)
    if version_match:
        return version_match.group(1)
    logging.warning("No version found in README")
    return "0.0.0"  # Default version if none found

def determine_version_change(commit_message):
    logging.info(f"Analyzing commit message: {commit_message}")
    if "BREAKING CHANGE:" in commit_message:
        return "major"
    elif commit_message.startswith("feat:"):
        return "minor"
    elif commit_message.startswith(("fix:", "refactor:")):
        return "patch"
    logging.info("No version change determined from commit message")
    return "none"

def increment_version(version, change_type):
    if change_type == "none":
        return version
    major, minor, patch = map(int, version.split('.'))
    if change_type == "major":
        return f"{major + 1}.0.0"
    elif change_type == "minor":
        return f"{major}.{minor + 1}.0"
    elif change_type == "patch":
        return f"{major}.{minor}.{patch + 1}"
    else:
        return version

def get_meaningful_commit_messages(repo, last_version):
    messages = []
    for commit in repo.iter_commits('HEAD'):
        msg = commit.message.strip().split('\n')[0]
        if msg.startswith(f"Version {last_version}"):
            break
        if msg.startswith(("feat:", "fix:", "refactor:")) or "BREAKING CHANGE:" in msg:
            if "[skip ci]" not in msg:
                messages.append(msg)
    return messages[::-1]  # Reverse the list to get chronological order

def update_package_json(new_version):
    try:
        with open('package.json', 'r') as file:
            package_data = json.load(file)

        package_data['version'] = new_version

        with open('package.json', 'w') as file:
            json.dump(package_data, file, indent=2)

        logging.info(f"Updated package.json to version {new_version}")
        return True
    except Exception as e:
        logging.error(f"Error updating package.json: {e}")
        return False

def update_readme():
    try:
        repo = Repo('.')
        current_branch = repo.active_branch.name
        logging.info(f"Current branch: {current_branch}")

        if current_branch not in ['master', 'dev', 'test-version-update']:
            logging.info(f"Currently on branch {current_branch}. No update needed.")
            return False

        with open('README.md', 'r') as file:
            content = file.read()

        current_version = get_latest_version(content)
        logging.info(f"Current version: {current_version}")

        commit_messages = get_meaningful_commit_messages(repo, current_version)
        logging.info(f"Found {len(commit_messages)} new relevant commit(s)")

        if not commit_messages:
            logging.info("No new relevant commit messages found. No update needed.")
            return False

        for msg in commit_messages:
            logging.info(f"Relevant commit: {msg}")

        new_version = current_version
        for msg in commit_messages:
            change_type = determine_version_change(msg)
            new_version = increment_version(new_version, change_type)

        logging.info(f"New version determined: {new_version}")

        if current_branch == 'dev':
            new_version += "-dev"

        # Update version badge
        content = re.sub(
            r'!\[Version\]\(https://img\.shields\.io/badge/version-(\d+\.\d+\.\d+)-blue\.svg\)',
            f'![Version](https://img.shields.io/badge/version-{new_version}-blue.svg)',
            content
        )

        # Find the Version History section
        history_match = re.search(r'(## Version History\n\n)((?:###[^\n]+\n(?:- [^\n]+\n?)*\n*)+)', content, re.DOTALL)

        if history_match:
            existing_history = history_match.group(2)
            existing_history = existing_history.replace(' (Latest)', '')
            new_entry = f"### Version {new_version} (Latest)\n"
            for msg in commit_messages:
                new_entry += f"- {msg}\n"
            updated_history = new_entry + "\n" + existing_history
            content = content[:history_match.start()] + f"## Version History\n\n{updated_history}" + content[history_match.end():]
        else:
            logging.warning("Version History section not found. No update performed.")
            return False

        if not update_package_json(new_version):
            logging.error("Failed to update package.json. Aborting README update.")
            return False

        with open('README.md', 'w') as file:
            file.write(content)
        logging.info(f"Updated README.md to version {new_version} on {current_branch} branch")
        return True

    except Exception as e:
        logging.error(f"An error occurred during README update: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    try:
        update_result = update_readme()
        logging.info(f"README update result: {'Updated' if update_result else 'No update needed'}")
    except Exception as e:
        logging.error(f"An error occurred: {e}", exc_info=True)