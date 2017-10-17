#!/usr/bin/env node

const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')
const rimraf = require('rimraf')
const pjson = require('../package.json');

const common = {
	'outDir': 'out',
	'winpackSuffix': '-win32-ia32',
	'installerSuffix': '-windows-installer'
}

deleteOutputFolder()
  .then(getInstallerConfig)
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  const rootPath = path.join(__dirname, '..')
  const outPath = path.join( rootPath, common.outDir )

  return Promise.resolve({
    appDirectory: path.join(outPath, pjson.name + common.winpackSuffix ),
    exe: pjson.name + '.exe',
    iconUrl: 'https://raw.githubusercontent.com/electron/electron-api-demos/master/assets/app-icon/win/app.ico',
    loadingGif: path.join(rootPath, 'assets', 'img', 'loading.gif'),
    noMsi: true,
    outputDirectory: path.join(outPath, pjson.name + common.installerSuffix ),
    setupExe: pjson.name + '-' + pjson.version + '-installer.exe',
    setupIcon: path.join(rootPath, 'assets', 'app-icon', 'win', 'app.ico'),
    skipUpdateIcon: true
  })
}

function deleteOutputFolder () {
  return new Promise((resolve, reject) => {
    rimraf(path.join( __dirname, '..', common.outDir, pjson.name  + common.installerSuffix ), (error) => {
      error ? reject(error) : resolve()
    })
  })
}
