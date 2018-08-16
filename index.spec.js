const WebpackNameModuleIdPlugin = require('./index');
const fs = require('fs');

describe("WebpackNameModuleIdPlugin - ", () => {

    describe("replaceModuleId", () => {
        let plugin;
        beforeEach(() => {
            plugin = new WebpackNameModuleIdPlugin({
                prefix: 'MyPrefix'
            });
            spyOn(fs, 'readFileSync').and.returnValue('file content');
            spyOn(plugin, 'extractPackageLock').and.returnValue('');
            spyOn(plugin, 'getVersionOfPackage').and.returnValue('1.0');
            spyOn(plugin, 'getMd5Checksum').and.callFake((resourceString) => {
                if (resourceString.includes('file content')) {
                    return 'fileChecksum';
                } else {
                    return 'stringChecksum';
                }
            });
            plugin.packageDependencies = {};
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

        it('should generate correct id for src modules', () => {
            const testModule = {
                id: 222,
                resource: 'src/shell/shell.file.js',
            };
            let generatedId = plugin.replaceModuleId(testModule, 'prefix/', 'prefix/', false);
            expect(generatedId).toEqual('prefix/shell/shell.file.js');
            generatedId = plugin.replaceModuleId(testModule, 'prefix/', 'prefix/', true);
            expect(generatedId).toEqual('prefix/shell/shell.file.js');
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
    });
});