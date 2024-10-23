module.exports = {
  repositoryUrl: 'https://github.com/TrustVC/trustvc.git',
  branches: [
    {
      name: 'main',
      release: true,
    },
    {
      name: 'v1',
      prerelease: 'alpha',
    },
  ],
  github: true,
  changelog: true,
  npm: true,
  outputPath: '/dist',
  buildTarget: 'build',
  tagFormat: 'v${version}',
  debug: true,
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        releaseRules: [
          {
            subject: '*BREAKING CHANGE*',
            release: 'major',
          },
          {
            footer: '*BREAKING CHANGE*',
            release: 'major',
          },
          {
            type: 'feat',
            release: 'minor',
          },
          {
            type: 'fix',
            release: 'patch',
          },
          {
            type: 'perf',
            release: 'patch',
          },
        ],
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        /*
            use conventionalcommits instead of conventional-changelog-angular (default)
            to introduce new sections in changelog
        */
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: 'Features', hidden: false },
            { type: 'fix', section: 'Bug Fixes', hidden: false },
            { type: 'docs', section: 'Miscellaneous Chores', hidden: false },
            { type: 'chore', section: 'Miscellaneous Chores', hidden: false },
          ],
        },
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING'],
        },
      },
    ],
    '@semantic-release/changelog',
    [
      '@semantic-release/npm',
      {
        npmPublish: true,
      },
    ],
    '@semantic-release/git',
    '@semantic-release/github',
  ],
};
