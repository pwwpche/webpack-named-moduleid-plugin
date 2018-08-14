var crypto = require('crypto');
var fs = require('fs');

function checksum(str) {
    return crypto.createHash('md5').update(str, 'utf8').digest('hex')
}

function WebpackNameModuleId(options) {
    this._options = options;
}

var packageDependencies = {};

function updatePackageDependencies() {
    try {
        packageDependencies = require('../../package-lock.json').dependencies;
    } catch (e) {
        console.error(
            '[WebpackNameModuleIdPlugin] Cannot find package-lock.json, skip adding package version to module id. \n' +
            'Notice: Module version is added in module id by default. Missing version number may cause your build' +
            'incompatible with other builds.'
        );
    }
}

function getVersionOfPackage(resourcePath) {
    var pathArr = resourcePath.split('/');
    var version = '', currentPackageName = '';
    for (var packageName of pathArr) {
        currentPackageName += (currentPackageName ? '/' : '') + packageName;
        if (packageDependencies.hasOwnProperty(currentPackageName)) {
            version = packageDependencies[currentPackageName].version;
        }
    }
    return version;
}

function replaceModuleId(module, modulePrefix) {
    var resourceName = module.resource;
    var replacedId = module.id;

    if (resourceName && resourceName.indexOf('node_modules/') !== -1) {
        replacedId = resourceName.substr(
            resourceName.lastIndexOf('node_modules/') + 'node_modules/'.length);
        var checkSumStr = '';
        try {
            const file = fs.readFileSync(resourceName);
            checkSumStr = checksum(file);
        } catch (e) {}
        replacedId += '_' + getVersionOfPackage(replacedId) + '_' + checkSumStr;
    } else if (resourceName) {
        if (resourceName.indexOf('src/') !== -1) {
            replacedId =
                resourceName.substr(resourceName.lastIndexOf('src/') + 'src/'.length);
        } else if (resourceName.indexOf('app/') !== -1) {
            replacedId =
                resourceName.substr(resourceName.lastIndexOf('app/') + 'app/'.length);
        }
    }

    if (!replacedId.toString().startsWith(modulePrefix)) {
        replacedId = modulePrefix + replacedId;
    }

    return replacedId;
}

WebpackNameModuleId.prototype.apply = function (compiler) {
    var modulePrefix = this._options.prefix || '';
    var skipPrefixForVendors = this._options['skip-prefix-for-vendors'] || true;
    compiler.plugin('compilation', function (compilation) {
        compilation.plugin('after-optimize-chunk-ids', function (chunks) {
            updatePackageDependencies();
            chunks.forEach(function (chunk) {
                const prefix = (skipPrefixForVendors && chunk.name === 'vendor') ?
                    '' :
                    modulePrefix;
                chunk.forEachModule(function (module) {
                    module.id = replaceModuleId(module, prefix);
                });
            });
        });
    });
};

module.exports = WebpackNameModuleId;
