const crypto = require('crypto');
const fs = require('fs');

function getMd5Checksum(str) {
    return crypto.createHash('md5').update(str, 'utf8').digest('hex')
}

function WebpackNameModuleId(options) {
    this._options = options || {};
}

let packageDependencies = {};

function extractPackageLock() {
    try {
        packageDependencies = require('../../package-lock.json').dependencies;
    } catch (e) {
        console.error(
            '[WebpackNameModuleIdPlugin] Cannot find package-lock.json, skip adding package version to module id. \n' +
            'Notice: Module version is added in module id by default. Missing version number may cause your build' +
            'incompatible with other builds.');
    }
}

function getVersionOfPackage(resourcePath) {
    const resourcePathChunks = resourcePath.split('/');
    let version = '', aggretatedPackageName = '';
    for (let pathChunk of resourcePathChunks) {
        aggretatedPackageName += (aggretatedPackageName ? '/' : '') + pathChunk;
        if (packageDependencies.hasOwnProperty(aggretatedPackageName)) {
            version = packageDependencies[aggretatedPackageName].version;
        }
    }
    return version;
}

function replaceModuleId(
    webpackModule, chunkPrefix, defaultPrefix, hideDependencies) {
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
            getMd5ChecksumStr = getMd5Checksum(resourceFile);
        } catch (e) {
        }

        replacedId +=
            '_' + getVersionOfPackage(replacedId) + '_' + getMd5ChecksumStr;
        if (hideDependencies) {
            replacedId = getMd5Checksum(replacedId);
        }
    } else if (resourceLocation) {
        // Webpack modules under /src or /app
        if (resourceLocation.indexOf('src/') !== -1) {
            replacedId = resourceLocation.substr(
                resourceLocation.lastIndexOf('src/') + 'src/'.length);
        } else if (resourceLocation.indexOf('app/') !== -1) {
            replacedId = resourceLocation.substr(
                resourceLocation.lastIndexOf('app/') + 'app/'.length);
        } else {
            // This path is unrecognized
            replacedId = resourceLocation;
        }
    } else {
        // Webpack multi modules. It has no resource path, but has a integer as its
        // module.id. It should be enforced a prefix to avoid collision.
        return defaultPrefix + webpackModule.id.toString();
    }

    return chunkPrefix + replacedId;
}

WebpackNameModuleId.prototype.apply = function (compiler) {
    const modulePrefix = this._options['prefix'] || '';
    const skipPrefixForVendors = this._options['skip-prefix-for-vendors'] || true;
    const hideDependencies = this._options['hide-dependencies'] || true;
    compiler.plugin('compilation', function (compilation) {
        compilation.plugin('after-optimize-chunk-ids', (chunks) => {
            extractPackageLock();
            chunks.forEach((chunk) => {
                const chunkPrefix = (skipPrefixForVendors && chunk.name === 'vendor') ?
                    '' :
                    modulePrefix;
                chunk.forEachModule((module) => {
                    module.id = replaceModuleId(
                        module, chunkPrefix, modulePrefix, hideDependencies);
                });
            });
        });
    });
};

module.exports = WebpackNameModuleId;
