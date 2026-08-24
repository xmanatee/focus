const cssInteropBabelPlugin =
  require('react-native-css-interop/dist/babel-plugin').default;

module.exports = (api) => {
  api.cache(true);
  return {
    presets: [require.resolve('babel-preset-expo')],
    plugins: [
      cssInteropBabelPlugin,
      [
        '@babel/plugin-transform-react-jsx',
        {
          runtime: 'automatic',
          importSource: 'react-native-css-interop',
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
