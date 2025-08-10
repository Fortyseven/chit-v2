// electron-builder configuration
module.exports = {
  appId: 'org.network47.chit-desktop',
  productName: 'Chit',
  directories: {
    output: 'dist',
    buildResources: 'build',
  },
  files: [
    '../public/**/*',
    'main.js',
    'package.json',
  ],
  extraResources: [],
  win: {
    target: 'nsis',
  },
  mac: {
    target: 'dmg',
  },
  linux: {
    target: 'AppImage',
  },
};
