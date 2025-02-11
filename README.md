# Vuku

An interactive CLI tool to help create git branches and conventional commit messages with emojis. This tool makes it easy to follow the [Conventional Commits](https://www.conventionalcommits.org/) specification while adding some fun with emojis! 🎉

## Features

- 🌳 Smart branch management
  - Warns when on main/master branch
  - Enforces branch naming conventions
  - Supports common branch types (feature/, bugfix/, etc.)
- 📝 Interactive prompts for creating commit messages
- 🎯 Follows Conventional Commits specification
- 😊 Optional emoji support
- 🔍 Scope support
- 💥 Breaking changes support
- 📚 Body and footer support
- 🎨 Colorful terminal output

## Usage

Simply run the command in any git repository:

```bash
npx vuku
```

### Options

- `-s, --skip-emoji`: Skip adding emojis to commit messages
- `-V, --version`: Output the version number
- `-h, --help`: Display help information

## Installation (Optional)

While npx is the recommended way to use vuku, you can install it globally if you prefer:

```bash
npm install -g vuku
```

Then run it with:
```bash
vuku
```

### Installing from source

```bash
git clone https://github.com/yourusername/vuku.git
cd vuku
npm install
npm run build
npm install -g .
```

## Branch Types

The tool supports the following branch types:

- `feature/` - For new features
- `bugfix/` - For bug fixes
- `hotfix/` - For urgent fixes
- `release/` - For release branches
- `support/` - For support branches

## Commit Types

The tool supports the following commit types:

- ✨ feat: A new feature
- 🐛 fix: A bug fix
- 📚 docs: Documentation only changes
- 💎 style: Changes that do not affect the meaning of the code
- ♻️ refactor: A code change that neither fixes a bug nor adds a feature
- ⚡️ perf: A code change that improves performance
- 🧪 test: Adding missing tests or correcting existing tests
- 🏗️ build: Changes that affect the build system or external dependencies
- 👷 ci: Changes to CI configuration files and scripts
- 🔧 chore: Other changes that don't modify src or test files
- ⏪ revert: Reverts a previous commit

## Example Output

```
⚠️  You are currently on main branch.
It is recommended to create a new branch for your changes.
? Would you like to create a new branch? Yes
? Select the type of branch: feature - For new features
? Enter the branch name (without the type prefix): user-auth
✅ Created and switched to branch: feature/user-auth

? Select the type of change you're committing: ✨ feat: A new feature
? Enter the scope of this change (optional): auth
? Enter a short description: add OAuth2 support
? Are there any breaking changes? No
? Enter a longer description (optional): Implemented OAuth2 authentication flow with support for multiple providers
? Enter any footer notes (optional): Closes #123

Commit message preview:

✨ feat(auth): add OAuth2 support

Implemented OAuth2 authentication flow with support for multiple providers

Closes #123

Proceed with commit? Yes

✅ Successfully created commit!
```

## License

MIT

## Author

Michael Magan 