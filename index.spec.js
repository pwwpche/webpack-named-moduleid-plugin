const WebpackNameModuleIdPlugin = require('./index');
const fs = require('fs');
const path = require('path');

describe("WebpackNameModuleIdPlugin - ", () => {

    describe("replaceModuleId", () => {
        let plugin, compiler;
        beforeEach(() => {
            plugin = new WebpackNameModuleIdPlugin({
                prefix: 'MyPrefix'
            });
            compiler = {
                plugin: (step, callback) => callback(),
            };
            compilation = {
                plugin: (step, callback) => callback(),
            }

            spyOn(fs, 'readFileSync').and.returnValue('file content');
            spyOn(plugin, 'extractPackageLock').and.returnValue('');
            spyOn(plugin, 'getVersionOfPackage').and.returnValue('1.0');
            spyOn(plugin, 'getMd5Checksum').and.callFake((resourceString) => {
                if (resourceString.includes('file content')) {
                    return 'fileChecksum';
                } else if (resourceString.includes('loader')){
                    return 'loaderChecksum_' + resourceString;
                } else {
                    return 'stringChecksum';
                }
            });
            plugin.packageDependencies = {};
            plugin.usedIds = new Set();
        });

        it('should generate correct id for modules under node_modules', () => {
            const testModule = {
                id: 123,
                resource: 'node_modules/@angular/123/test.file.js',
            };
            const generatedId = plugin.replaceModuleId(testModule, 'prefix/', 'prefix/', false);
            const generatedIdEncrypted = plugin.replaceModuleId(testModule, 'prefix/', 'prefix/', true);
            expect(generatedId).toEqual('prefix/@angular/123/test.file.js_1.0_fileChecksum');
            expect(generatedIdEncrypted).toEqual('prefix/stringChecksum');
        });

        it('should generate correct id for modules under source folder', () => {
            const testModule = {
                id: 222,
                libIdent: () => 'libIdent', 
                resource: __dirname + '/src/app/shell/shell.file.js',
            };
            let generatedId = plugin.replaceModuleId(testModule, 'prefix/', 'prefix/', false, 'src/app');
            expect(generatedId).toEqual('prefix/shell/shell.file.js');
            generatedId = plugin.replaceModuleId(testModule, 'prefix/', 'prefix/', true, 'src/app');
            expect(generatedId).toEqual('prefix/shell/shell.file.js_stringChecksum');
        });

        it('should generate correct id for Webpack multi modules', () => {
            const testModule = {
                id: 222,
            };
            let generatedId = plugin.replaceModuleId(testModule, 'prefix/', 'prefix/', false);
            expect(generatedId).toEqual('prefix/222');
            generatedId = plugin.replaceModuleId(testModule, 'prefix/', 'prefix/', true);
            expect(generatedId).toEqual('prefix/222');
        });

        it('should enforce prefix for Webpack multi modules', () => {
            const testModule = {
                id: 222,
            };
            let generatedId = plugin.replaceModuleId(testModule, '', 'prefix/', false);
            expect(generatedId).toEqual('prefix/222');
            generatedId = plugin.replaceModuleId(testModule, '', 'prefix/', true);
            expect(generatedId).toEqual('prefix/222');
        });

        it('should not generate id for modules whose id are replaced', () => {
            const testModule = {
                id: 'prefix/1234',
                resource: 'apps/test/test.js'
            };
            let generatedId = plugin.replaceModuleId(testModule, 'prefix/', 'prefix/', false);
            expect(generatedId).toEqual('prefix/1234');
            generatedId = plugin.replaceModuleId(testModule, 'prefix/', 'prefix/', true);
            expect(generatedId).toEqual('prefix/1234');
        });

        it('should remove prefix for libraries in vendor chunk', () => {
            const testModule = {
                id: 222,
                resource: 'node_modules/@angular/apps/test.file.js'
            };
            const generatedId = plugin.replaceModuleId(testModule, '', 'prefix/', false);
            const generatedIdEncrypted = plugin.replaceModuleId(testModule, '', 'prefix/', true);
            expect(generatedId).toEqual('@angular/apps/test.file.js_1.0_fileChecksum');
            expect(generatedIdEncrypted).toEqual('stringChecksum');
        });

        it('should resolve package-lock path correctly', () => {
            const generatedOptions = plugin.extractOptions({});
            expect(generatedOptions.packageLock).toBeDefined();
            expect(generatedOptions.packageLock).toEqual(path.resolve('./package-lock.json'));
        });

        it('should generate different id for resources with same resouce name', () => {
            const testModule1 = {
                id: 111,
                libIdent: (context) => './node_modules/a-loader.js!./node_modules/@angular/apps/test.file.js',
                resource: 'node_modules/@angular/apps/test.file.js'
            };
            const testModule2 = {
                id: 222,
                libIdent: (context) => './node_modules/b-loader.js!./node_modules/@angular/apps/test.file.js',
                resource: 'node_modules/@angular/apps/test.file.js'
            };
            const testModule3 = {
                id: 333,
                libIdent: (context) => './node_modules/c-loader.js!./node_modules/@angular/apps/test.file.js',
                resource: 'node_modules/@angular/apps/test.file.js'
            };
            const generatedId1 = plugin.replaceModuleId(testModule1, '', 'prefix/', false);
            const generatedId2 = plugin.replaceModuleId(testModule2, '', 'prefix/', false);
            const generatedId3 = plugin.replaceModuleId(testModule3, '', 'prefix/', false);
            expect(generatedId1).toEqual('@angular/apps/test.file.js_1.0_fileChecksum');
            expect(generatedId2).toEqual('@angular/apps/test.file.js_1.0_fileChecksum_./node_modules/b-loader.js!./node_modules/@angular/apps/test.file.js');
            expect(generatedId3).toEqual('@angular/apps/test.file.js_1.0_fileChecksum_./node_modules/c-loader.js!./node_modules/@angular/apps/test.file.js');

            const hashedId1 = plugin.replaceModuleId(testModule1, '', 'prefix/', true);
            const hashedId2 = plugin.replaceModuleId(testModule2, '', 'prefix/', true);
            const hashedId3 = plugin.replaceModuleId(testModule3, '', 'prefix/', true);
            expect(hashedId1).toEqual('stringChecksum');
            expect(hashedId2).toEqual('stringChecksum_loaderChecksum_./node_modules/b-loader.js!./node_modules/@angular/apps/test.file.js');
            expect(hashedId3).toEqual('stringChecksum_loaderChecksum_./node_modules/c-loader.js!./node_modules/@angular/apps/test.file.js');
        })
    });
});