# webpack-named-moduleid-plugin

Webpack is assigning module name with a random int number. Every time webpack compiles, this module name could change. 

This plugin fix the module name into its resource path and the app name.

## Usage:
```
const WebpackNameModuleIdPlugin = require('webpack-name-moduleId-plugin');

/* ... */

plugins: [
      new WebpackNameModuleIdPlugin({prefix: 'PROXY/'}),
      /* ... */
]
```


