#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const simple_git_1 = __importDefault(require("simple-git"));
const git = (0, simple_git_1.default)();
const program = new commander_1.Command();
const COMMIT_TYPES = [
    { name: "✨ feat: A new feature", value: "feat" },
    { name: "🐛 fix: A bug fix", value: "fix" },
    { name: "📚 docs: Documentation only changes", value: "docs" },
    {
        name: "💎 style: Changes that do not affect the meaning of the code",
        value: "style",
    },
    {
        name: "♻️ refactor: A code change that neither fixes a bug nor adds a feature",
        value: "refactor",
    },
    { name: "⚡️ perf: A code change that improves performance", value: "perf" },
    {
        name: "🧪 test: Adding missing tests or correcting existing tests",
        value: "test",
    },
    {
        name: "🏗️ build: Changes that affect the build system or external dependencies",
        value: "build",
    },
    { name: "👷 ci: Changes to CI configuration files and scripts", value: "ci" },
    {
        name: "🔧 chore: Other changes that don't modify src or test files",
        value: "chore",
    },
    { name: "⏪ revert: Reverts a previous commit", value: "revert" },
];
const EMOJI_MAP = {
    feat: "✨",
    fix: "🐛",
    docs: "📚",
    style: "💎",
    refactor: "♻️",
    perf: "⚡️",
    test: "🧪",
    build: "🏗️",
    ci: "👷",
    chore: "🔧",
    revert: "⏪",
};
const BRANCH_TYPES = [
    { name: "feature - For new features", value: "feature" },
    { name: "bugfix - For bug fixes", value: "bugfix" },
    { name: "hotfix - For urgent fixes", value: "hotfix" },
    { name: "release - For release branches", value: "release" },
    { name: "support - For support branches", value: "support" },
];
program
    .name("vuku")
    .description("Interactive git branch and commit message generator following conventional commits")
    .version("1.0.0")
    .option("-s, --skip-emoji", "Skip adding emojis to commit messages")
    .option("-d, --detailed", "Show additional optional fields during commit")
    .addHelpText("after", `
Example usage:
  $ vuku
  $ vuku --skip-emoji
  $ vuku --detailed

The tool will guide you through:
1. Creating a new branch (optional)
2. Creating a conventional commit message with:
   - Type of change (feat, fix, docs, etc.)
   - Description
   - Breaking changes indicator
   ${chalk_1.default.gray("When using --detailed flag:")}
   ${chalk_1.default.gray("   - Scope (optional)")}
   ${chalk_1.default.gray("   - Extended description (optional)")}
   ${chalk_1.default.gray("   - Footer notes (optional)")}`)
    .parse(process.argv);
const options = program.opts();
async function getCurrentBranch() {
    var _a;
    try {
        const status = await git.status();
        return (_a = status.current) !== null && _a !== void 0 ? _a : "";
    }
    catch (error) {
        console.error(chalk_1.default.red("Error getting current branch:"), error.message);
        process.exit(1);
    }
}
async function handleFileStaging() {
    try {
        const status = await git.status();
        const unstagedFiles = [
            ...status.not_added,
            ...status.modified,
            ...status.deleted,
        ];
        if (unstagedFiles.length === 0) {
            const stagedFiles = [...status.staged, ...status.created];
            if (stagedFiles.length === 0) {
                console.log(chalk_1.default.yellow("No files to commit. Please add or modify files first."));
                return false;
            }
            return true;
        }
        const { action } = await inquirer_1.default.prompt([
            {
                type: "list",
                name: "action",
                message: "You have unstaged files. What would you like to do?",
                choices: [
                    { name: "Select individual files to stage", value: "select" },
                    { name: "Stage all files", value: "all" },
                    { name: "Cancel", value: "cancel" },
                ],
            },
        ]);
        if (action === "cancel") {
            return false;
        }
        if (action === "all") {
            await git.add(".");
            console.log(chalk_1.default.green("✅ All files have been staged"));
            return true;
        }
        const { selectedFiles } = await inquirer_1.default.prompt([
            {
                type: "checkbox",
                name: "selectedFiles",
                message: "Select files to stage:",
                choices: unstagedFiles.map((file) => ({
                    name: file,
                    value: file,
                })),
            },
        ]);
        if (selectedFiles.length === 0) {
            console.log(chalk_1.default.yellow("No files selected. Operation cancelled."));
            return false;
        }
        await Promise.all(selectedFiles.map((file) => git.add(file)));
        console.log(chalk_1.default.green(`✅ Staged ${selectedFiles.length} file(s)`));
        return true;
    }
    catch (error) {
        console.error(chalk_1.default.red("Error staging files:"), error.message);
        return false;
    }
}
async function generateCommitMessage() {
    const currentBranch = await getCurrentBranch();
    const isOnMainBranch = ["main", "master"].includes(currentBranch);
    // Check and handle file staging first
    const filesStaged = await handleFileStaging();
    if (!filesStaged) {
        process.exit(0);
    }
    let createBranch = false;
    if (isOnMainBranch) {
        console.log(chalk_1.default.yellow(`⚠️  You are currently on ${currentBranch} branch.`));
        console.log(chalk_1.default.yellow("It is recommended to create a new branch for your changes."));
        const { shouldCreateBranch } = await inquirer_1.default.prompt([
            {
                type: "confirm",
                name: "shouldCreateBranch",
                message: "Would you like to create a new branch?",
                default: true,
            },
        ]);
        if (!shouldCreateBranch) {
            const { confirmContinue } = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "confirmContinue",
                    message: chalk_1.default.red("Are you sure you want to commit directly to " + currentBranch + "?"),
                    default: false,
                },
            ]);
            if (!confirmContinue) {
                console.log(chalk_1.default.blue("Operation cancelled"));
                process.exit(0);
            }
        }
        createBranch = shouldCreateBranch;
    }
    else {
        const { shouldCreateBranch } = await inquirer_1.default.prompt([
            {
                type: "confirm",
                name: "shouldCreateBranch",
                message: "Would you like to create a new branch?",
                default: false,
            },
        ]);
        createBranch = shouldCreateBranch;
    }
    const questions = [
        {
            type: "list",
            name: "branchType",
            message: "Select the type of branch:",
            choices: BRANCH_TYPES,
            when: () => createBranch,
        },
        {
            type: "input",
            name: "branchName",
            message: "Enter the branch name (without the type prefix):",
            when: () => createBranch,
            validate: (input) => {
                if (input.length === 0)
                    return "Branch name is required";
                if (!/^[a-z0-9-_]+$/i.test(input)) {
                    return "Branch name can only contain letters, numbers, hyphens and underscores";
                }
                return true;
            },
        },
        {
            type: "list",
            name: "type",
            message: "Select the type of change you're committing:",
            choices: COMMIT_TYPES,
        },
        {
            type: "input",
            name: "scope",
            message: "Enter the scope of this change (optional):",
            when: () => options.detailed,
        },
        {
            type: "input",
            name: "description",
            message: "Enter a short description:",
            validate: (input) => input.length > 0 ? true : "Description is required",
        },
        {
            type: "confirm",
            name: "hasBreaking",
            message: "Are there any breaking changes?",
            default: false,
        },
        {
            type: "input",
            name: "body",
            message: "Enter a longer description (optional):",
            when: () => options.detailed,
        },
        {
            type: "input",
            name: "footer",
            message: "Enter any footer notes (optional):",
            when: () => options.detailed,
        },
    ];
    const answers = await inquirer_1.default.prompt(questions);
    if (createBranch) {
        const branchFullName = `${answers.branchType}/${answers.branchName}`;
        try {
            await git.checkoutLocalBranch(branchFullName);
            console.log(chalk_1.default.green(`✅ Created and switched to branch: ${branchFullName}`));
        }
        catch (error) {
            console.error(chalk_1.default.red("Error creating branch:"), error.message);
            return;
        }
    }
    const emoji = options.skipEmoji ? "" : `${EMOJI_MAP[answers.type]} `;
    const scope = answers.scope ? `(${answers.scope})` : "";
    const breaking = answers.hasBreaking ? "!" : "";
    let commitMessage = `${emoji}${answers.type}${scope}${breaking}: ${answers.description}`;
    if (answers.body) {
        commitMessage += `\n\n${answers.body}`;
    }
    if (answers.footer) {
        commitMessage += `\n\n${answers.footer}`;
    }
    const { confirm } = await inquirer_1.default.prompt([
        {
            type: "confirm",
            name: "confirm",
            message: `Commit message preview:\n\n${chalk_1.default.green(commitMessage)}\n\nProceed with commit?`,
            default: true,
        },
    ]);
    if (confirm) {
        try {
            await git.commit(commitMessage);
            console.log(chalk_1.default.green("✅ Successfully created commit!"));
            const { shouldPush } = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "shouldPush",
                    message: "Would you like to push this branch?",
                    default: true,
                },
            ]);
            if (shouldPush) {
                try {
                    const currentBranch = await getCurrentBranch();
                    await git.push("origin", currentBranch);
                    console.log(chalk_1.default.green(`✅ Successfully pushed to origin/${currentBranch}!`));
                }
                catch (error) {
                    console.error(chalk_1.default.red("Error pushing branch:"), error.message);
                }
            }
        }
        catch (error) {
            console.error(chalk_1.default.red("Error creating commit:"), error.message);
        }
    }
}
generateCommitMessage().catch(console.error);
