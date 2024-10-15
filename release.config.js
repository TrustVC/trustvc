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
    '@semantic-release/release-notes-generator',
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
