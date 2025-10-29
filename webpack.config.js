const path = require("path");

module.exports = {
    entry: {
        background: "./src/background/background.ts",
        content_script: "./src/content/content_script.ts",
        popup: "./src/popup/popup.ts"
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js"
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    }
};
