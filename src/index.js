const fs = require('fs');
const path = require('path');

const findRoot = require('find-root');

/**
 * given a string which looks like a filesystem path, resolve it to something useful
 * @param {String} path
 * @param {Array<String>} extensions - a list of file extensions to append if needed
 * @return {String|undefined} a path to a real file, or undefined
 */
function pathToFile(basePath, extensions) {
    try {
        const pathStat = fs.statSync(basePath);

        if (pathStat.isDirectory()) {
            return `${basePath}/index.js`;
        }

        /* extension was specified, or no extension in file name */
        return basePath;
    } catch (ex) {
        /* nothing exists at `path`; let's try adding extensions to it */
        return extensions.map((ext) => `${basePath}.${ext}`)
            .find((file) => {
                try {
                    fs.statSync(file);

                    return true;
                } catch (exx) {
                    return false;
                }
            });
    }
}

function resolve(modulePath, sourceFile, resolverConfig) {
    const {
        fileExtensions,
        rootDir
    } = resolverConfig || {};
    const sourceFileDir = path.dirname(sourceFile);
    const packageRoot = findRoot(sourceFile);
    const projectRoot = rootDir
        ? path.resolve(packageRoot, rootDir)
        : sourceFileDir;
    const extensionsList = (fileExtensions || [ `js` ])
        .map((ext) => ext.replace(`.`, ``));
    let found = false;
    let fsPath = null;

    switch (modulePath[0]) {
        case `/`:
            /* absolute path.  resolve relative to project root */
            fsPath = pathToFile(
                path.resolve(packageRoot, modulePath.slice(1)),
                extensionsList
            );

            break;
        case `~`:
            /* tilde path.  resolve relative to nearest node_modules directory,
             * or the project root - whichever comes first */
            fsPath = path.dirname(sourceFileDir);

            while (fsPath !== projectRoot
                && path.basename(path.dirname(fsPath)) !== `node_modules`
                && fsPath !== `/`) {
                fsPath = path.dirname(fsPath);
            }

            fsPath = pathToFile(
                path.resolve(fsPath, modulePath.replace(/^~\/?/, ``)),
                extensionsList
            );

            break;
        case `.`:
            /* relative path */
            fsPath = pathToFile(
                path.resolve(sourceFileDir, modulePath),
                extensionsList
            );

            break;
        default:
            /* core module or node_module */
            try {
                fsPath = require.resolve(modulePath, {
                    paths: [ path.dirname(sourceFile) ]
                });
            } catch (ex) {
                fsPath = null;
            }

            break;
    }

    if (fsPath) {
        found = true;
    }

    return {
        found,
        path: fsPath
    };
}

module.exports = {
    interfaceVersion: 2,
    resolve
};
