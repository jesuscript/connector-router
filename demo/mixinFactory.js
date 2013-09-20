/*global _ */

window.mixinFactory = function(factory){
    var hooks, r= /^__before|^__after/;
    
    var runHook = function(hookName){
        var hookArgs = _.rest(arguments);
        _.each(this["__" + hookName], function(fn){fn.apply(this, hookArgs);},this);
    }, runDestroyHooks = function () {
        this.runHook("beforeDestroy");
        this.runHook("afterDestroy");
    }, mix = function(mixins, baseName){
        var mapStringToMixin = function(name){ return factory[baseName][name + "Mixin"]; };
        var unzipMixin = function(m){ return typeof m == "string" ? _.map(m.split(" "), mapStringToMixin) : m; };
        
        return _.reduce(_.flatten(_.map(mixins, unzipMixin)), function(memo, mixin){
            _.extend(memo, _.omit(mixin = mixin || {}, hooks = _.filter(_.keys(mixin), r.test.bind(r)) ));
            _.each(hooks, function(hook){ memo[hook] = _.union((memo[hook] || []), mixin[hook]); });

            return memo;
        }, { runHook: runHook, destroy: runDestroyHooks });
    };
    
    factory.factory = function(baseName){
        var defaultMixins = _.rest(arguments);
        
        factory[baseName] = function(className){ 
            var raw, proto = mix(_.union(defaultMixins, _.rest(arguments)), baseName);
            
            factory[baseName][className] = function(opts){
                (raw = _.extend({__className: className, __baseName: baseName}, proto)).runHook("beforeInit",opts);
                raw.init && raw.init.call(raw, opts);
                raw.runHook("afterInit",opts);

                return raw;
            };
        };

        factory[baseName + "Mixin"] = function(mixinName){
            return factory[baseName][mixinName + "Mixin"] = mix(_.rest(arguments), baseName);
        };
    };
};
