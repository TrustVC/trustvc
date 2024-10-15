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
      range: '1.x',
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
      '@semantic-release/npm',
      {
        npmPublish: true,
      },
    ],
  ],
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
};
