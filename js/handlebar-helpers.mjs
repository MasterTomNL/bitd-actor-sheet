export const registerHandlebarsHelpers = function() {
  Handlebars.registerHelper("numLoop", function (num, options) {
    let result = "";
    for (let i = 0, j = num; i < j; i++) {
      result = result + options.fn(i);
    }

    return result;
  });
};