# Contributing to Pinggy Node.js SDK

First off, thank you for considering contributing to this project! Your help is greatly appreciated.

This document provides guidelines for contributing to the Pinggy Node.js SDK. Please read it carefully to ensure a smooth and effective contribution process.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or newer)
- [npm](https://www.npmjs.com/)
- `make`

### Building from Source


1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Build the project:**
    The `Makefile` provides a convenient way to build the entire project, including the native addons and the TypeScript code.
    ```bash
    make build
    ```

### Running Tests

The project uses Jest for testing. To run the test suite, use the following command:

```bash
npm test
```

### Using Your Local Build in Another Project

After building the project with `make build`, a `.tgz` package file is created in the project's root directory. You can install this local package in another project on your machine for testing purposes.

1.  **Navigate to your other project's directory:**
    ```bash
    cd /path/to/your/other/project
    ```

2.  **Install the local SDK package:**
    Use `npm install` with the path to the `.tgz` file. You can use a glob pattern to avoid typing the exact version number.
    ```bash
    npm install /path/to/sdk-nodejs/@pinggy/pinggy-*.tgz
    ```
    Replace `/path/to/sdk-nodejs/` with the actual absolute path to your cloned `sdk-nodejs` directory.

Now you can import and use your locally built version of the `@pinggy/pinggy` package in your other project just like you would with a package installed from the npm registry.


#### Using npm link
Alternatively, you can use `npm link` to symlink the local package into your other project:

1.  **In the SDK project directory, run:**
    ```bash
    npm link
    ```

2.  **In your other project's directory, run:**
    ```bash
    npm link @pinggy/pinggy
    ```

This creates a symbolic link from your `node_modules` to your local SDK project, allowing you to test changes without repeatedly reinstalling. 

**Remember to unlink when you're done:**

```bash
# In your other project
npm unlink @pinggy/pinggy

# In the SDK project
npm unlink
npm install
```



### Reporting Bugs

If you find a bug, please open an issue on our [GitHub repository](https://github.com/Pinggy-io/sdk-nodejs/issues). Please include as much detail as possible, such as:

- A clear and descriptive title.
- A detailed description of the bug, including steps to reproduce it.
- The version of the SDK you are using.
- Your Node.js version and operating system.
- Any relevant code snippets or error messages.

### Suggesting Enhancements

If you have an idea for an enhancement, feel free to open an issue to discuss it. This allows us to coordinate our efforts and prevent duplication of work.

### Pull Requests

We welcome pull requests! Before submitting a pull request, please ensure the following:

1.  **Open an issue:** Discuss the changes you wish to make by opening an issue first.
2.  **Fork the repository:** Create your own fork of the project.
3.  **Create a branch:** Make your changes in a new git branch:
    ```bash
    git checkout -b my-feature-branch
    ```
4.  **Follow the coding style:** Ensure your code adheres to the existing style and conventions.
5.  **Add/update tests:** If you are adding a new feature or fixing a bug, please add or update tests accordingly.
6.  **Ensure tests pass:** Run the test suite to make sure everything is working as expected.
7.  **Commit your changes:**
    ```bash
    git commit -m "feat: Add some feature"
    ```
8.  **Push to your fork:**
    ```bash
    git push origin my-feature-branch
    ```
9.  **Submit a pull request:** Open a pull request to the `main` branch of the original repository.


## Architecture

Core functionality is derived from `libpinggy` (https://github.com/Pinggy-io/libpinggy).

We use [Node-API](https://nodejs.org/api/n-api.html#node-api) to call functions for `.so` files or `.dll` files. The headers of the functions are available in `pinggy.h`. Note that we may need to replace this `pinggy.h` file periodically with an updated version from `libpinggy` repo (https://github.com/Pinggy-io/libpinggy/blob/main/src/sdk/pinggy.h).

