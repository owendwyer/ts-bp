const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack');

module.exports = {
  entry: "./src/index.ts",
  output: {
    path: __dirname + "/dist/js",
    filename: "index.js",
  },
  devServer: {
    static: "./dist",
    port: 9000,
    host: '0.0.0.0'
  },
  mode: "development",
  devtool: "source-map",
  plugins: [
    new HtmlWebpackPlugin({
    	scriptLoading: 'defer',
    	template: 'src/html/indextemplatedev.html'
  	}),
    new webpack.DefinePlugin({
      'OPD_ENV': JSON.stringify('dev')
    })
  ],
	externals: {
		"pixi.js": "PIXI",
  	"opdPreloader": "opdPreloader",
    "opdFirebase": "opdFirebase",
    "gsap": "gsap",
		"WebFont": "WebFont"
	//	{"Howler": "Howler"}
	},
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "eslint-loader",
        options: {
          fix: true,
        },
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
};
