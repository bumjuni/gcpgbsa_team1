module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'module:@react-native/babel-preset',
      'nativewind/babel', // Moved here
    ],
    plugins: [
      // Remove 'nativewind/babel' from here if present
    ],
  };
};


// module.exports = {
//   presets: ['module:@react-native/babel-preset'],
//   plugins: ['nativewind/babel']
// };
