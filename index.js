"use strict";

function WebpackNameModuleId(options) {
    this.options = options || {};
}

WebpackNameModuleId.prototype.apply = function(compiler) {

    compiler.plugin("compilation", function(compilation) {
        compilation.plugin("after-optimize-module-ids", function(modules) {
            modules.forEach(function(module) {
                var resourceName = module.resource;
                if (resourceName) {
                    if (resourceName.indexOf('node_modules/') !== -1) {
                        module.id = resourceName.substr(resourceName.lastIndexOf('node_modules/') + 'node_modules/'.length);
                    } else if (resourceName.indexOf('src/') !== -1) {
                        module.id = resourceName.substr(resourceName.lastIndexOf('src/') + 'src/'.length);
                    }
                }
            });
        });
    });
};



module.exports = WebpackNameModuleId;

