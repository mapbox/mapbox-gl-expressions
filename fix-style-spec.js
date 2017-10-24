// Hack to fix the style spec package.json file to make sure it's bundled
// properly

const fs = require('fs');
const path = require('path');
const browserifySettings = require(path.join(__dirname, 'package.json')).browserify;

const pkg = require('mapbox-gl/src/style-spec/package.json');

pkg.browserify = browserifySettings;

fs.writeFileSync('node_modules/mapbox-gl/src/style-spec/package.json', JSON.stringify(pkg, null, 2));

