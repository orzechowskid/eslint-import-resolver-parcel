# eslint-import-resolver-parcel
resolver for eslint-plugin-import using the Parcel module resolution algorithm.

Supports the resolution of:

- core imports and node_modules imports: `import fs from 'fs'; import { Foo, Bar } from 'foobar';`
- relative imports: `import Baz from './foo/bar/baz';`
- absolute imports (scoped to the closest directory containing a package.json file): `import Baz from '/foo/bar/baz';`
- tilde imports (scoped to the root directory specified in your .eslintrc.js): `import Baz from '~/foo/bar/baz';`
- the `alias` field in your project's package.json:
```JSON
  // package.json
  "alias": {
    "naughty-package": "nice-package"
  }

  // source file
  import Foo from 'naughty-package'; // <-- eslint resolves this to 'nice-package'
```

# Installation
- install eslint-plugin-import from npm:

`npm install --save-dev eslint-plugin-import`

- install eslint-import-resolver-parcel:

`npm install --save-dev https://github.com/orzechowskid/eslint-import-resolver-parcel`

- add the following to your .eslintrc.js (or equivalent):

```JSON
  "plugins": [ "import" ],
  "settings": {
    "import/resolver": {
      "parcel": {
        "rootDir": "src",
        "fileExtensions": [ ".js", ".jsx" ]
      }
    }
  }
```

# Configuration
## `rootDir`
required.  A filesystem directory containing the file specified when you invoke parcel.  For instance, the value for this option would be `src` if you invoke parcel with the command `parcel src/index.js`.

## `fileExtensions`
optional; default value `[ ".js" ]`.  A list of extensions to search for when resolving a module if none is provided.  For instance, if the value for this option is `[ ".foo", ".bar", ".baz" ]` and your source file contains the line `import X from './data/x'`, the resolver will try `./data/x.foo`, `./data/x.bar`, and `./data/x.baz` before giving up.

# Bugs
probably a lot

# License
MIT
