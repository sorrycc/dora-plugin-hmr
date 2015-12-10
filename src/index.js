import 'babel-polyfill';
import hotMiddleware from 'webpack-hot-middleware';
import webpack from 'atool-build/lib/webpack';

let middleware = null;

export default {

  'middleware': (args) => {
    if (!global.g_dora_plugin_atool_build_compiler) {
      throw new Error('[error] must used together with dora-plugin-atool-build');
    }

    return function* (next) {
      if (!middleware) {
        middleware = hotMiddleware(global.g_dora_plugin_atool_build_compiler);
      }
      yield middleware.bind(null, this.req, this.res);
      yield next;
    };
  },

  'atool-build.updateWebpackConfig': (args, webpackConfig) => {
    // 修改 entry, 加上 webpack-hot-middleware/client
    webpackConfig.entry = Object.keys(webpackConfig.entry).reduce((memo, key) => {
      memo[key] = [
        'webpack-hot-middleware/client',
        webpackConfig.entry[key],
      ];
      return memo;
    }, {});

    // 修改 babel-loader 参数
    webpackConfig.module.loaders.forEach(loader => {
      if (loader.loader === 'babel') {
        loader.query.plugins.push([
          'react-transform',
          {
            transforms: [
              {
                transform: 'react-transform-hmr',
                imports: ['react'],
                locals: ['module'],
              },
              {
                transform: 'react-transform-catch-errors',
                imports: ['react', 'redbox-react'],
              },
            ],
          },
        ]);
      }
      return loader;
    });

    // Hot reload plugin
    webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

    return webpackConfig;
  }

};
