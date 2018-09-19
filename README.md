# webpack-named-moduleid-plugin

Webpack is assigning module name with a random int number. Every time webpack compiles, this module name could change. 

This plugin fix the module name into its resource path and the app name.

## Usage:
```js
const WebpackNameModuleIdPlugin = require('webpack-name-moduleId-plugin');

/* ... */

plugins: [
      new WebpackNameModuleIdPlugin({
            prefix: 'PROXY/',
            "skip-prefix-for-vendors": true,
            "hide-dependencies": true,
            "source-folder-name": "app",
            "package-lock": "./package-lock.json"
      }),
      /* ... */
]
```
## Options:
* **prefix**: Prefix added to the module ids. This should be a string
* **skip-prefix-for-vendors**: Force plugin not to add prefix for modules in a chunk named `vendor`. Default is `true`.
* **hide-dependencies**: Encrypt the module id string with MD5 encryption. Ids of modules under `node_modules` will be
  encrypted, but module ids of source files under `source-folder` are not encrypted. 
* **source-folder-name**: Folder of modules that don't need to be name encrypted. Default is `app`.
* **package-lock**: Path to `package-lock.json`. It is required for getting module version.

## Description:
This plugin uses Webpack `after-optimize-chunk-id` lifecycle hook, and looks into every module in each generated chunk.
For each module, it changes the module id to make it fixed and more meaningful.
After bundling completes, in the build bundles, you will notice module id changed to:
```js
/***/ "PROXIES/314": function() ...
/***/ "PROXIES/@angular/animations/@angular/animations.es5.js_4.3.4_b4ce8ea53a8f2acf5589246494e80181": function() ...
/***/ "PROXIES/shell/appwrapper.module.ts": function() ...
```

Modules in bundles now have a module id with following format, where
```js
module.id = 'PREFIX' + 'resource_name' + '_' + 'module_version' + '_' + 'resource_hash' [+ 'libIdent_hash']
```
* __PREFIX__: Prefix defined in plugin options, default empty. Eg. `PROXIES/`
* __resource_name__: Path and filename of the dependency, Eg. `@angular/animations/@angular/animations.es5.js`
* __module_version__: Version number of this module, this is read from `package-lock.json`. Eg. `4.3.4`
* __resouce_hash__: Md5 hash of the resouce file. Eg. `b4ce8ea53a8f2acf5589246494e80181`
* __libIdent_hash__: Md5 hash of the resource module identifier. Eg. `b4ce8ea53a8f2acf5589246494e80181`. This will only be added
  when there are modules with same resouce name, adding this avoids module id conflict.

Modules placed in `source-folder-name` are considered source files. They will not be appended with hashcode or version number
Modules under `node_modules` folder are considered libraries. They will have `module_version` and `resource_hash` to prevent redundant loadings.
