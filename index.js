const Filter = require('broccoli-filter');

function I18nLazyLookup (inputTree, options) {
  if (!(this instanceof I18nLazyLookup)) return new I18nLazyLookup(inputTree, options);

  Filter.call(this, inputTree, options); // this._super()

  options = options || {};

  this.inputTree   = inputTree;
  this.description = options.description;
}
I18nLazyLookup.prototype = Object.create(Filter.prototype);
I18nLazyLookup.prototype.constructor = I18nLazyLookup;

I18nLazyLookup.prototype.canProcessFile = function (relativePath) {
  let extension = this.pathExtension(relativePath);

  if (extension === 'js' || extension === 'hbs') {
    return true;
  } else {
    return null;
  }
};

I18nLazyLookup.prototype.getDestFilePath = function(relativePath) {
  return relativePath;
};

I18nLazyLookup.prototype.pathExtension = function(relativePath) {
  let tmp = relativePath.toString().split('.');
  return tmp[tmp.length - 1];
};

I18nLazyLookup.prototype.processString = function (str, relativePath) {
  let extension = this.pathExtension(relativePath),
      pathChunks = relativePath.split('.')[0].split('/'),
      prefix;
  // Remove app-name and templates/controllers/components suffix
  pathChunks.shift();
  pathChunks.pop();

  // Ignore dash prefix for partial templates
  if (pathChunks.length && pathChunks[pathChunks.length - 1].charAt(0) === "-") {
    pathChunks[pathChunks.length - 1] = pathChunks[pathChunks.length - 1].substring(1);
  }

  for (i=0; i<pathChunks.length; i++) {
    pathChunks[i] = camelize(pathChunks[i])
  }

  prefix = pathChunks.join('.');

  if (extension === 'js') {
    return this.processLazyLookup(str, prefix, '[\'"](\\@\\.[\\w-\\.]+)[\'"]');
  } else if (extension === 'hbs') {
    return this.processLazyLookup(str, prefix, '[\'"](\\.[\\w-\\.]+)[\'"]');
  } else {
    return str;
  }
};

let STRING_CAMELIZE_REGEXP_1 = (/(\-|\_|\.|\s)+(.)?/g);
let STRING_CAMELIZE_REGEXP_2 = (/(^|\/)([A-Z])/g);

function camelize(key) {
  return key.replace(STRING_CAMELIZE_REGEXP_1, function (match, separator, chr) {
    return chr ? chr.toUpperCase() : '';
  }).replace(STRING_CAMELIZE_REGEXP_2, function (match) {
    return match.toLowerCase();
  });
}


I18nLazyLookup.prototype.processLazyLookup = function(str, prefix, regexp) {
  let matches = str.match(new RegExp(regexp, 'g')) || [],
      match,
      matchedString,
      finalString,
      i18nKey;

  for (let i = 0; matches[i]; ++i) {
    match = matches[i].match(new RegExp(regexp));

    matchedString = match[0];

    i18nKey = prefix + match[1].substring(1);
    finalString = matchedString.replace(match[1], i18nKey);

    str = str.replace(matchedString, finalString);
  }

  return str;
};



module.exports = {
  name: 'ember-i18n-hierarchic',

  setupPreprocessorRegistry: function(type, registry) {
    let addonContext = this;
    registry.add('template', {
      name: 'ember-i18n-hierarchic',
      ext: ['hbs', 'handlebars'],
      toTree: function(tree) {
        return I18nLazyLookup(tree);
      }
    });
    registry.add('js', {
      name: 'ember-i18n-hierarchic',
      ext: 'js',
      toTree: function(tree) {
        return I18nLazyLookup(tree);
      }
    });
  }
};
