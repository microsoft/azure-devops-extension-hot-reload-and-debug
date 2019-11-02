# Azure DevOps Extension Hot Reload and Debug

[![Build Status](https://dev.azure.com/1es-cat/azure-devops-extension-hot-reload-and-debug/_apis/build/status/microsoft.azure-devops-extension-hot-reload-and-debug?branchName=master)](https://dev.azure.com/1es-cat/azure-devops-extension-hot-reload-and-debug/_build/latest?definitionId=26&branchName=master)

This repository demonstrates how to load an Azure DevOps extension's code directly from the dev machine rather than bundle all the code and deploy it through the marketplace. We will leverage the (somewhat hidden) capability in Azure DevOps to load content from localhost, which will enable us to use hot reload and debug in VS Code.

For more information about our motivation in developing this project, see our blog post.

## Prerequisites

Download and install the following tools

1. [Visual Studio Code](https://code.visualstudio.com/download)
1. [Firefox](https://www.mozilla.org/firefox/) (because the VS Code Debugger for Chrome extension [doesn't support iframes](https://github.com/microsoft/vscode-chrome-debug/issues/786) yet)
1. The [Debugger for Firefox](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-firefox-debug) VS Code extension
1. The [tfx-cli](https://www.npmjs.com/package/tfx-cli) npm package
1. The [webpack](https://www.npmjs.com/package/webpack) npm package
1. The [webpack-dev-server](https://www.npmjs.com/package/webpack-dev-server) npm package

> If you would prefer not to install the npm packages globally, you can add them to devDependencies in your `package.json` file and invoke them with scripts. You can use the [package.json](./package.json) in this repo as a template for scripts and to ensure you have the correct versions of packages in your extension.

## Starting a new extension

If you're starting a new extension, you can either clone this repo or use our [Yeoman generator](https://github.com/microsoft/azure-devops-extension-yeoman-generator) to scaffold a new extension with support for hot reload and debugging. (The following sections provide information about how we configured the template.)

### Clone

```shell
git clone https://github.com/microsoft/azure-devops-extension-hot-reload-and-debug.git
```

### Yeoman

```shell
npm install -g yo
npm install -g @microsoft/generator-azure-devops-extension
yo @microsoft/azure-devops-extension
```

## Enabling an existing extension

To reconfigure your existing extension, follow these steps to get everything working. This configuration assumes you know the basics of how to set up an Azure DevOps extension using Typescript and webpack. For more information, see the [Azure DevOps extension docs](https://docs.microsoft.com/en-us/azure/devops/extend) or the [azure-devops-extension-sample](https://github.com/microsoft/azure-devops-extension-sample) repo.

### Extension manifest

The "trick" to get everything working is to set `baseUri` in the extension manifest file to `https://localhost:3000`. This setting tells the extension to load resources from your local dev server rather than the packaged extension.

> Your port can be different than 3000. For the purposes of this document we will use 3000 consistently, but if you have a port conflict, you can change this to any port that works for your environment.

We recommend using an overrides JSON file to set this value only for your dev builds. The `tfx` command line utility supports overriding any values in your extension manifest with the values in this file while packaging by passing the `--overrides-file` parameter. We will use this feature to set the value of `baseUri` differently for dev vs. release builds.

Create an overrides JSON file with the following content for your dev build called `dev.json`:

```json
{
  "id": "[extension-id]-dev",
  "public": false,
  "baseUri": "https://localhost:3000"
}
```

You can leave default values for these properties in your extension manifest or, for consistency, you can delete them from your manifest and create a `release.json` overrides file for release builds as well (in which case we suggest you create a configs folder to keep things organized):

```json
{
  "id": "[extension-id]",
  "public": true
}
```

> You can move additional settings you would like to override for specific build configurations from the extension manifest to the `dev.json` or `release.json` files if you choose. These values are just the recommended minimum settings.

### Webpack config

You will need to enable source maps in `webpack.config.js`. Set the `devtool` property to `inline-source-map`. You will also want to set `devServer.https` to `true` and `devServer.port` to `3000`.

```js
module.exports = {
  devtool: "inline-source-map",
  devServer: {
    https: true,
    port: 3000
  }
  // ...
};
```

> For this example, we've validated that `inline-source-map` works well. However, you may find that another source map option works better for your project.

By default, webpack serves its compiled, in-memory files directly under `localhost:3000` but the extension is looking for files in the `dist` path. To fix this discrepancy, set `output.publicPath` to `/dist/` in the webpack config. Now webpack will serve files from `localhost:3000/dist` and your extension should load correctly.

```js
module.exports = {
  output: {
    publicPath: "/dist/"
    // ...
  }
  // ...
};
```

> Your extension may load fine without this change because webpack will serve files from the filesystem if it does not have an in-memory version to serve instead. Therefore, webpack may serve files from the `dist` folder if it exists, but hot reload will not work.

In order to make webpack copy HTML files from the `src` folder to the `dist` folder, you need to add the `copy-webpack-plugin` npm package to your project, and then add the following lines to your `webpack.config.json` file.  These changes will configure webpack to copy all HTML files from `src`:

```js
const CopyWebpackPlugin = require("copy-webpack-plugin");
// ...

module.exports = {
  plugins: [new CopyWebpackPlugin([{ from: "**/*.html", context: "src" }])],
  // ...
};
```

### VS Code's launch.json

The last configuration change we need to make is to set up a debug configuration for VS Code that launches Firefox with the correct path mappings. Add a path mapping with `url` set to `webpack:///` and `path` set to `${workspaceFolder}/`. To avoid restarting Firefox every time you debug, you can also set the `reAttach` property on the configuration to `true`.

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Firefox",
      "type": "firefox",
      "request": "launch",
      "url": "https://localhost:3000/",
      "reAttach": true,
      "pathMappings": [
        {
          "url": "webpack:///",
          "path": "${workspaceFolder}/"
        }
      ]
    }
  ]
}
```

## Using hot reload and debugging

Now that you have configured the extension, follow these steps to use hot reload and start debugging your code.

### Install dependencies and build the extension

Before we deploy the extension, we need to install its dependencies and compile the code using the following commands:

```shell
npm install
npm run compile:dev
```

### Deploy your dev extension to Azure DevOps

You will need to deploy your extension to the marketplace at least once using the following command:

```shell
tfx extension publish --manifest-globs vss-extension.json --overrides-file configs/dev.json --token [token]
```

> The `[token]` here is an Azure DevOps PAT (personal access token) with the **Marketplace (Publish)** scope and access set to **All accessible organizations**. For more information, see [Authenticate access with personal access tokens](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate).

After the extension is published, share it with your Azure DevOps organization and install it. Navigate to a project and you will find a new hub called "Hello World!" When you click it, you will notice that the hub won't load correctly. It isn't loading because the extension is configured to load all its resources (html, images, etc.) from `localhost:3000`, but the dev server isn't running yet.

### Launch your dev server

Start the webpack-dev-server with:

```shell
webpack-dev-server --mode development
```

Now if you go to `localhost:3000` in your browser, you should get an untrusted certificate error page. Select **Advanced** and then select **Accept the Risk and Continue**.

Go back to Azure DevOps and reload. Your extension should now load correctly and any changes to the source code will cause webpack to recompile and reload the extension automatically.

Although most code changes will be reflected immediately, you may still need to occasionally update your extension in the marketplace. The dev extension loads all its resources from the webpack-dev-server, but the manifest itself is being loaded from the published code. Therefore, any changes to the manifest file will not be properly reflected in Azure DevOps until the extension has been republished.

### Launch your VS Code project to debug against Azure DevOps

In VS Code, press **F5** to start debugging (making sure the webpack-dev-server is still running). The default launch configuration should be set to **Launch Firefox**.

Once Firefox starts up, you will have to go through the steps of allowing the `localhost:3000` certificate again and log into your Azure DevOps account. From now on, if you leave this Firefox window open, the debugger will reattach instead of starting a clean Firefox instance each time.

Once you are logged in to Azure DevOps, your extension should be running. Set a breakpoint in a method in VS Code and you should see that breakpoint hit when that method executes.

> Chrome configurations are included in the sample as well in case the Debugger for Chrome extension eventually supports iframes. However, debugging iframes is only supported in the Debugger for Firefox extension at this time.

## Conclusion

We hope you enjoy the ability to iterate faster and debug right in VS Code!

If you want to start a new extension project, check out the [Yeoman generator](https://github.com/microsoft/azure-devops-extension-yeoman-generator) our team has built to get everything set up faster. Also, if you would prefer to debug your extension in Chrome, please upvote this [GitHub issue](https://github.com/microsoft/vscode-chrome-debug/issues/786) and add in any relevant comments.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
