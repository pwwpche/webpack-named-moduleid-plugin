const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function WebpackNameModuleId(options) {
  this._options = options || {};
}

WebpackNameModuleId.prototype.packageDependencies = {};

WebpackNameModuleId.prototype.getMd5Checksum = function(str) {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

WebpackNameModuleId.prototype.extractPackageLock = function(packageLockPath) {
  try {
    this.packageDependencies = require(packageLockPath).dependencies;
  } catch (e) {
    console.error(
        '[WebpackNameModuleIdPlugin] Cannot find package-lock.json, skip adding package version to module id. \n' +
        'Notice: Module version is added in module id by default. Missing version number may cause your build \n' +
        'incompatible with other builds.');
  }
}

WebpackNameModuleId.prototype.getVersionOfPackage = function(resourcePath) {
  const resourcePathChunks = resourcePath.split('/');
  let version = '', aggretatedPackageName = '';
  for (let pathChunk of resourcePathChunks) {
    aggretatedPackageName += (aggretatedPackageName ? '/' : '') + pathChunk;
    if (this.packageDependencies.hasOwnProperty(aggretatedPackageName)) {
      version = this.packageDependencies[aggretatedPackageName].version;
    }
  }
  return version;
}

WebpackNameModuleId.prototype.replaceModuleId = function(webpackModule, chunkPrefix, defaultPrefix, hideDependencies, srcFolderPrefix) {
  if (webpackModule.id && webpackModule.id.toString().startsWith(defaultPrefix)) {
    //Id is already replaced for this module.
    return webpackModule.id;
  }

  const resourceLocation = webpackModule.resource;
  let replacedId = '';

  if (resourceLocation && resourceLocation.indexOf('node_modules/') !== -1) {
    // Webpack modules with module id and located in node_modules
    replacedId = resourceLocation.substr(
        resourceLocation.lastIndexOf('node_modules/') + 'node_modules/'.length);
    var getMd5ChecksumStr = '';
    try {
      var resourceFile = fs.readFileSync(resourceLocation);
      getMd5ChecksumStr = this.getMd5Checksum(resourceFile);
    } catch (e) {
    }

    replacedId +=
        '_' + this.getVersionOfPackage(replacedId) + '_' + getMd5ChecksumStr;
    if (hideDependencies) {
      replacedId = this.getMd5Checksum(replacedId);
    }
  } else if (resourceLocation) {
    const sourceLocation = path.resolve(srcFolderPrefix);
    // Webpack modules under source folder
    if (resourceLocation.startsWith(sourceLocation)) {
      replacedId = resourceLocation.substr(sourceLocation.length + 1);
    } else {
      // This path is unrecognized
      console.error('[WebpackNameModuleIdPlugin] Unexpected resource path:', '\n',
          'module.resource: ', resourceLocation, '\n',
          'Resolved source folder location: ', sourceLocation, '\n',
          'module should be in resolved source location. ', '\n',
          'Did you set source-folder-name correctly?');
      replacedId = resourceLocation;
    }
  } else {
    // Webpack multi modules. It has no resource path, but has a integer as its
    // module.id. It should be enforced a prefix to avoid collision.
    return defaultPrefix + webpackModule.id.toString();
  }
  return chunkPrefix + replacedId;
}


WebpackNameModuleId.prototype.extractOptions = function(options) {
  const modulePrefix = options['prefix'] || '';
  const skipPrefixForVendors = options['skip-prefix-for-vendors'] || true;
  const hideDependencies = options['hide-dependencies'] || true;
  const srcFolderPrefix = options['source-folder-name'] || 'app';
  console.log('extract', __dirname);
  const packageLock = options['package-lock'] || path.resolve(__dirname, './package-lock.json');
  return {
    modulePrefix: modulePrefix,
    skipPrefixForVendors: skipPrefixForVendors,
    hideDependencies: hideDependencies,
    srcFolderPrefix: srcFolderPrefix,
    packageLock: packageLock,
  }
}

WebpackNameModuleId.prototype.apply = function(compiler) {
  const {modulePrefix, skipPrefixForVendors, hideDependencies, srcFolderPrefix, 
    packageLock} = this.extractOptions(this._options);
  compiler.plugin('compilation', (compilation) => {
    compilation.plugin('after-optimize-chunk-ids', (chunks) => {
      this.extractPackageLock(packageLock);
      chunks.forEach((chunk) => {
        const chunkPrefix = (skipPrefixForVendors && chunk.name === 'vendor') ?
            '' :
            modulePrefix;
        chunk.forEachModule((module) => {
          module.id = this.replaceModuleId(
              module, chunkPrefix, modulePrefix, hideDependencies, srcFolderPrefix);
        });
      });
    });
  });
};

module.exports = WebpackNameModuleId;
