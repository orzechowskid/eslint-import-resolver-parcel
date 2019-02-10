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

function resolveAbsolute(modulePath, packageRoot, extensionsList) {
    return pathToFile(
        path.resolve(packageRoot, modulePath.slice(1)),
        extensionsList
    );
}

function resolveTilde(modulePath, sourceFileDir, projectRoot, extensionsList) {
    let basePath = path.dirname(sourceFileDir);

    while (basePath !== projectRoot
        && path.basename(path.dirname(basePath)) !== `node_modules`
        && basePath !== `/`) {
        basePath = path.dirname(basePath);
    }

    return pathToFile(
        path.resolve(basePath, modulePath.replace(/^~\/?/, ``)),
        extensionsList
    );
}

function resolveRelative(modulePath, sourceFileDir, extensionsList) {
    return pathToFile(
        path.resolve(sourceFileDir, modulePath),
        extensionsList
    );
}

function resolveExternalModule(module, sourceFile) {
    /* core module or node_module */
    try {
        return require.resolve(module, {
            paths: [ path.dirname(sourceFile) ]
        });
    } catch (ex) {
        return null;
    }
}

function resolve(modPath, sourceFile, resolverConfig) {
    const {
        fileExtensions,
        rootDir
    } = resolverConfig || {};
    const sourceFileDir = path.dirname(sourceFile);
    const packageRoot = findRoot(sourceFile);
    const packageJson = require(path.resolve(packageRoot, `package.json`));
    const modulePath = packageJson.alias[modPath] || modPath;
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
            fsPath = resolveAbsolute(modulePath, packageRoot, extensionsList);

            break;
        case `~`:
            /* tilde path.  resolve relative to nearest node_modules directory,
             * or the project root - whichever comes first */
            fsPath = resolveTilde(modulePath, sourceFileDir, projectRoot, extensionsList);

            break;
        case `.`:
            /* relative path */
            fsPath = resolveRelative(modulePath, sourceFileDir, extensionsList);

            break;
        default:
            /* core module or node_modules module */
            fsPath = resolveExternalModule(modulePath, sourceFile, packageJson);

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
