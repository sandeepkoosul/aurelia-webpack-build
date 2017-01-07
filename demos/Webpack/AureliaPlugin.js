const AureliaDependenciesPlugin = require("./AureliaDependenciesPlugin");
const ConventionDependenciesPlugin = require("./ConventionDependenciesPlugin");
const GlobDependenciesPlugin = require("./GlobDependenciesPlugin");
const HtmlDependenciesPlugin = require("./HtmlDependenciesPlugin");
const PreserveModuleNamePlugin = require("./PreserveModuleNamePlugin");

module.exports = class AureliaPlugin {
  constructor(options = {}) {
    this.options = Object.assign({
      includeAll: undefined,  // or folder, e.g. "src"
      moduleMethods: [],
      viewsFor: "src/**/*.{ts,js}",
      viewsExtensions: ".html",
    },
    options);
  }

  apply(compiler) {
    const opts = this.options;

    if (opts.includeAll) {
      // Grab everything approach
      let entry = compiler.options.entry;
      if (typeof entry !== "string")
        throw new Error("includeAll option only works with a single entry point.")
      compiler.apply(
        // This plugin ensures that everything in /src is included in the bundle.
        // This prevents splitting in several chunks but is super easy to use and setup,
        // no change in existing code or PLATFORM.nameModule() calls are required.
        new GlobDependenciesPlugin({ [entry]: opts.includeAll + "/**" })
      );
    }

    else {
      // Traced dependencies approach
      compiler.apply(      
        // This plugin looks for companion files by swapping extensions,
        // e.g. the view of a ViewModel. @useView and co. should use PLATFORM.moduleName().
        new ConventionDependenciesPlugin(opts.viewsFor, opts.viewsExtensions),
        // This plugin adds dependencies traced by html-requires-loader
        // Note: the config extension point for this one is html-requires-loader.attributes.
        new HtmlDependenciesPlugin()
      );
    }

    // Common plugins
    compiler.apply(
      // This plugin traces dependencies in code that are wrapped in PLATFORM.moduleName() calls
      new AureliaDependenciesPlugin(...opts.moduleMethods),
      // This plugin preserves module names for dynamic loading by aurelia-loader
      new PreserveModuleNamePlugin()
    );
  }
}