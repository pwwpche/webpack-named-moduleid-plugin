var crypto = require('crypto');
var fs = require('fs');

function checksum (str) {
    return crypto
        .createHash('md5')
        .update(str, 'utf8')
        .digest('hex')
}


function WebpackNameModuleId(options) {
    this._options = options || {
        prefix: '',
    };
}

var packageDependencies = require('../../package-lock.json').dependencies;
function getVersionOfPackage(resourcePath) {
    var pathArr = resourcePath.split('/');
    var version = '', currentPackageName = '';
    for( var packageName of pathArr) {
        currentPackageName += (currentPackageName ? '/' : '') + packageName;
        if (packageDependencies.hasOwnProperty(currentPackageName)) {
            version = packageDependencies[currentPackageName].version;
        }
    }
    return version;
}

WebpackNameModuleId.prototype.apply = function(compiler) {
    modulePrefix = this._options.prefix;
    compiler.plugin("compilation", function(compilation) {
        compilation.plugin("after-optimize-module-ids", function(modules) {
            modules.forEach(function(module) {
                var resourceName = module.resource;
                if (resourceName) {
                    if (resourceName.indexOf('node_modules/') !== -1) {
                        module.id = resourceName.substr(resourceName.lastIndexOf('node_modules/') + 'node_modules/'.length);
                        var checkSumStr = '';
                        try{
                            const file = fs.readFileSync(resourceName);
                            checkSumStr = checksum(file);
                        } catch (e) {}
                        module.id += '_' + getVersionOfPackage(module.id) + '_' + checkSumStr;
                        return ;
                    } else if ( resourceName.indexOf('src/') !== -1) {
                        module.id = resourceName.substr(resourceName.lastIndexOf('src/') + 'src/'.length);
                    } else if (resourceName.indexOf('app/') !== -1) {
                        module.id = resourceName.substr(resourceName.lastIndexOf('app/') + 'app/'.length);
                    }
                }
                if (!module.id.toString().startsWith(modulePrefix)) {
                    module.id = modulePrefix + module.id;
                }
            });
        });
    });
};

module.exports = WebpackNameModuleId;
