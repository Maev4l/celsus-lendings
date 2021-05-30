module.exports = {
  all: true,
  include: ['src/**/**.js'],
  exclude: [],
  useSpawnWrap: true,
  extends: '@istanbuljs/nyc-config-babel',
};
