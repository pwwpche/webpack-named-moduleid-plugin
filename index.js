function WebpackNameModuleId(options) {
    this.options = options || {};
}

WebpackNameModuleId.prototype.constructor = function(options) {
    this.prefix = options.prefix ? '' : options.prefix;
};

WebpackNameModuleId.prototype.apply = function(compiler) {
    compiler.plugin("compilation", function(compilation) {
        compilation.plugin("after-optimize-module-ids", function(modules) {
            console.log(this);
            modules.forEach(function(module) {
                var resourceName = module.resource;
                if (resourceName) {
                    if (resourceName.indexOf('node_modules/') !== -1) {
                        module.id = resourceName.substr(resourceName.lastIndexOf('node_modules/') + 'node_modules/'.length);
                        return;
                    } else if (resourceName.indexOf('src/') !== -1) {
                        module.id = resourceName.substr(resourceName.lastIndexOf('src/') + 'src/'.length);
                    } else if (resourceName.indexOf('app/') !== -1) {
                        module.id = resourceName.substr(resourceName.lastIndexOf('app/') + 'app/'.length);
                    }
                    module.id = this.prefix + module.id;
                }
            });
        });
    });
};

module.exports = WebpackNameModuleId;

