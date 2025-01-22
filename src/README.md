# Pinggy Project

## Setup

1. Use Node.js version 16:
    ```sh
    nvm install 16
    nvm use 16
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

## Node-gyp Commands

- Configure the build:
    ```sh
    node-gyp configure
    ```

- Build the project:
    ```sh
    node-gyp build
    ```

- Clean the build files:
    ```sh
    node-gyp clean
    ```

- Rebuild the project:
    ```sh
    node-gyp rebuild
    ```