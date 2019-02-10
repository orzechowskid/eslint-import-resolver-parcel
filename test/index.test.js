/* eslint-env jest, jasmine */

const path = require('path');

const findRoot = require('find-root');

const resolver = require('../src/index');

describe(`eslint-import-resolver-parcel`, function() {
    const mockPkgDir = __dirname;
    const mockRootDir = path.join(mockPkgDir, `root`);
    const mockSrcDir = path.join(mockRootDir, `foo`);
    const mockSrc = path.join(mockSrcDir, `index.js`);
    const mockConfig = {
        rootDir: `root`
    };

    describe(`when resolving relative imports`, function() {
        it(`resolves the module path`, function() {
            const mockImport = `./bar/root_foo_bar_importMe`;
            const result = resolver.resolve(mockImport, mockSrc, mockConfig);

            expect(result.found).toBe(true);
            expect(result.path).toEqual(path.resolve(mockSrcDir, `${mockImport}.js`));
        });

        it(`resolves index.js when given a directory`, function() {
            const mockImport = `./bar`;
            const result = resolver.resolve(mockImport, mockSrc, mockConfig);

            expect(result.found).toBe(true);
            expect(result.path).toEqual(path.resolve(mockSrcDir, `${mockImport}/index.js`));
        });

        it(`resolves modules with extensions`, function() {
            const mockImport = `./root_foo_styles.scss`;
            const result = resolver.resolve(mockImport, mockSrc, mockConfig);

            expect(result.found).toBe(true);
        });

        it(`does not resolve non-existent modules`, function() {
            const mockImport = `./bar/fake`;
            const result = resolver.resolve(mockImport, mockSrc, mockConfig);

            expect(result.found).toBe(false);
        });
    });

    describe(`when resolving absolute imports`, function() {
        it(`resolves the module path`, function() {
            const mockImport = `/root/foo/baz/root_foo_baz_importMe`;
            const result = resolver.resolve(mockImport, mockSrc, mockConfig);

            expect(result.found).toBe(true);
        });

        it(`resolves index.js when given a directory`, function() {
            const mockImport = `root/foo/bar`;
            const result = resolver.resolve(`/${mockImport}`, mockSrc, mockConfig);

            expect(result.found).toBe(true);
            expect(result.path).toEqual(path.resolve(mockPkgDir, `${mockImport}/index.js`));
        });

        it(`resolves modules with extensions`, function() {
            const mockImport = `root/root_styles.scss`;
            const result = resolver.resolve(`/${mockImport}`, mockSrc, mockConfig);

            expect(result.found).toBe(true);
        });

        it(`does not resolve non-existent modules`, function() {
            const mockImport = `/test/root/foo/bar/fake`;
            const result = resolver.resolve(mockImport, mockSrc, mockConfig);

            expect(result.found).toBe(false);
        });
    });

    describe(`when resolving tilde imports`, function() {
        it(`resolves paths starting with '~'`, function() {
            const mockImport = `root_importMe`;
            const result = resolver.resolve(`~${mockImport}`, mockSrc, mockConfig);

            expect(result.found).toBe(true);
            expect(path.dirname(result.path)).toEqual(mockRootDir);
        });

        it(`resolves paths starting with '~/'`, function() {
            const mockImport = `root_importMe`;
            const result = resolver.resolve(`~/${mockImport}`, mockSrc, mockConfig);

            expect(result.found).toBe(true);
            expect(path.dirname(result.path)).toEqual(mockRootDir);
        });

        it(`resolves paths to modules in subdirectories of ~`, function() {
            const mockImport = `foo/bar/baz/root_foo_bar_baz_importMe`;
            const result = resolver.resolve(`~/${mockImport}`, mockSrc, mockConfig);

            expect(result.found).toBe(true);
            expect(result.path).toEqual(path.resolve(mockRootDir, `${mockImport}.js`));
        });

        it(`resolves modules with extensions`, function() {
            const mockImport = `~/foo/root_foo_styles.scss`;
            const result = resolver.resolve(mockImport, mockSrc, mockConfig);

            expect(result.found).toBe(true);
        });

        it(`does not resolve non-existent modules`, function() {
            const result = resolver.resolve(`~/fake`, mockSrc, mockConfig);

            expect(result.found).toBe(false);
        });

        it(`does not resolve modules which exist but live outside of rootDir`, function() {
            const thisFile = path.basename(__filename);
            const result = resolver.resolve(`~/${thisFile}`, mockSrc, mockConfig);

            expect(result.found).toBe(false);
        });
    });

    describe(`when resolving external module imports`, function() {
        it(`resolves core node.js modules`, function() {
            const result = resolver.resolve(`fs`, mockSrc, mockConfig);

            expect(result.found).toBe(true);
            expect(result.path).toEqual(`fs`);
        });

        it(`resolves third-party node_modules`, function() {
            const result = resolver.resolve(`jest`, mockSrc, mockConfig);

            expect(result.found).toBe(true);
            expect(result.path.includes(path.join(`node_modules`, `jest`)))
                .toBe(true);
        });

        it(`resolves module aliases`, function() {
            const result = resolver.resolve(`naughty-package`, mockSrc, mockConfig);

            expect(result.found).toBe(true);
            expect(result.path.includes(`nice-package`)).toBe(true);
        });

        it(`resolves individual files inside third-party modules`, function() {
            const result = resolver.resolve(`jest/package.json`, mockSrc, mockConfig);

            expect(result.found).toBe(true);
        });

        it(`does not resolve non-existent modules`, function() {
            const result = resolver.resolve(`fake${Date.now()}`, mockSrc, mockConfig);

            expect(result.found).toBe(false);
        });
    });
});
