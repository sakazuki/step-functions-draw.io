const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    filename: 'aws-step-functions.js',
    path: path.join(__dirname, 'dist')
  },
  module: {
    rules: [
      { test: /\.ts$/, use: "ts-loader" },
      {
        test: /\.css/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: { url: false }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: [".ts"]
  },
  externals: {
    draw: 'Draw'
  }
};
