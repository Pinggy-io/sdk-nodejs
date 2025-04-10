# Pinggy Node.js SDK

## Workflow

- Detect OS and architecture
- Pull the latest version of the code from the repo
- Sets up Node.js version 22 as of now
- Installs system specific build tools
- Runs `npm install`
- internally runs `node-pre-gyp install --fallback-to-build`
- this triggers `node-pre-gyp` to search for the current os and arch specific tarball from the `“binary.host”` link set in `package.json`
  - If it finds a match it is directly downloaded
  - If it fails, `node-pre-gyp` dispatches to `node-gyp`
  - node-gyp executes a `prebuild_step` where it runs the custom `install.js` script which tries to find and download the system specific `.so/.dll/.lib` file
  - If it succeeds in doing so, `node-gyp` proceeds to build the `addon.node`
- The `postinstall` script copies the created .node file to the required destination (/lib in our case) and deletes the `/build` folder and the `.lib/.so` files
- Runs `npm run package`
  - This creates the `tarball` in the `/build/stage` directory using pre-gyp
  - Finally `node-pre-gyp-github publish` searches for the tarballs and saves them to `github release` artifacts
- When a user installs the package `node-pre-gyp` automatically searches for the os-arch specific tarball from the artifacts, if a match is found it downloads the .node from the tarball and places it in /lib directory.
