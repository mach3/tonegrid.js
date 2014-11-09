/*!
 * MatrixTones
 * -----------
 * Matrix sequencer by Web Audio API
 *
 * @version 0.1.0 (2014-11-09)
 * @author mach3 <http://github.com/mach3>
 * @license MIT
 * @url https://github.com/mach3/tonegrid.js
 */
(function($, global){

    // Compatibility
    global.AudioContext = global.AudioContext || global.webkitAudioContext || null;
    if(! global.AudioContext){
        return global.MatrixTones = null;
    }

    /**
     * ToneGrid
     * --------
     * @class ToneGrid controller
     */
    var ToneGrid = function(el, options){
        this.init.apply(this, arguments);
    };

    (function(){
        var api = ToneGrid.prototype;

        /**
         * Options:
         */
        api.defaults = {
            offset: 1,             // Offset for scale (Integer)
            prefix: "tonegrid",    // Prefix for CSS class names (String)
            speed: 120,            // Speed (Integer)
            easing: 8,             // Easing (Integer)
            major: true,           // Major or minor, TRUE if major (Boolean)
            type: "sine"           // Type name of oscillator (String)
        };

        api.options = null;
        api.$el = null;
        api.playing = false;
        api.timer = null;
        api.index = -1;
        api.frames = null;
        api.tones = null;
        api.data = null;

        /**
         * Constructor
         * @constructor
         * @param {HTML*Element|String} el
         * @param {Object} options (optional)
         */
        api.init = function(el, options){
            var o, my;

            u.events(this);
            u.config(this);
            u.rebase(this, ["process", "initData", "onClick"]);

            // config
            o = this.config(options);

            // props
            this.$el = $(el).addClass(o.prefix);
            this.render();
            this.initTones();
            this.initData();

            // events
            this.$el.on("change", "input[type=checkbox]", this.initData);
            this.on("change", this.onChange);
            if(u.iOS()){
                this.$el.on("click", this.onClick);
            }
        };

        /**
         * Initialize Tones
         */
        api.initTones = function(){
            var my, freqs, o;

            my = this;
            freqs = this.getFrequencies();
            o = this.options;

            if(! this.tones){
                this.tones = [];
                freqs.forEach(function(f, i){
                    var tone = new ToneGrid.Tone(i, {
                        frequency: f,
                        easing: o.easing,
                        type: o.type
                    })
                    my.tones.push(tone);
                });
            } else {
                freqs.forEach(function(f, i){
                    my.tones[i].config({
                        easing: o.easing,
                        frequency: f,
                        type: o.type
                    });
                });
            }
        };

        /**
         * Get frequencies set of Tones
         * @returns {Array}
         */
        api.getFrequencies = function(){
            var o, map, offsets;

            o = this.options;
            map = [o.offset - 22];
            offsets = o.major ? [2,2,3,2,3] : [2,1,4,3,2];
            u.times(4, function(){
                offsets.forEach(function(o){
                    map.push(u.last(map) + o);
                });
            });
            map = map.slice(0, 20);
            return map.map(function(i){
                return 440 * Math.pow(1.05946309436, i - 1);
            }).reverse();
        };

        /**
         * Initialize data by input
         */
        api.initData = function(){
            var data = [];
            this.frames.each(function(){
                var f = [];
                $(this).find("input").each(function(){
                    if(this.checked){
                        f.push(parseInt(this.value, 10));
                    }
                });
                data.push(f);
            });
            this.data = data;
        };

        /**
         * Render interface
         */
        api.render = function(){
            var o, tmp, renderLabel;

            o = this.options;
            tmp = $("<div>");
            renderLabel = function(index, frame){
                return $("<label>").append(
                    $("<input>", {
                        "name": "frame-" + frame,
                        "type": "checkbox",
                        "value": index
                    }),
                    $("<span>", {
                        "class": o.prefix + "-label"
                    }).append(
                        $("<span>", {
                            "class": o.prefix + "-label-inner"
                        })
                    )
                );
            };

            u.times(20, function(f){
                var frame = $("<div>", {
                    "class": o.prefix + "-frame",
                    "data-name": f
                });
                u.times(20, function(i){
                    renderLabel(i, f).appendTo(frame);
                });
                frame.appendTo(tmp);
            });

            tmp.children().appendTo(this.$el);
            this.frames = this.$el.find(u.format(".%s-frame", o.prefix));
        };

        /**
         * Start playing
         */
        api.play = function(){
            this.playing = true;
            this.process();
        };

        /**
         * Stop playing
         */
        api.stop = function(){
            this.playing = false;
        };

        /**
         * Handler: Process for playing
         */
        api.process = function(){
            var o, my, index;

            o = this.options;
            my = this;

            clearTimeout(this.timer);

            if(this.playing){
                this.timer = setTimeout(this.process, parseInt(60000 / o.speed / 4, 10));
                index = this.index = (this.index + 1) % 20;
                this.frames.removeClass("active").eq(index).addClass("active");
                this.data[index].forEach(function(value){
                    my.tones[value].tone();
                });
            }
        };

        /**
         * Hanlder: changing the options' value
         * @param {Event} e
         * @param {Object} o
         */
        api.onChange = function(e, o){
            if(["offset", "major", "easing", "type"].indexOf(o.key) >= 0){
                this.initTones();
            }
        };

        /**
         * Handler: clicking element in container
         */
        api.onClick = function(){
            this.tones.forEach(function(tone){
                tone.play();
            });
            this.$el.off("click", this.onClick);
        };

        /**
         * JSON interface
         */
        api.toJSON = function(){
            return {
                data: this.data,
                options: u.filter(this.config(), function(value, key){
                    return ["speed", "offset", "easing", "major"].indexOf(key) >= 0;
                }),
                frequencies: this.getFrequencies()
            };
        };

        api.toMIDI = function(){
            return void 0;
        };

    }());

    // AudioContext
    ToneGrid.context = null;
    
    /**
     * ToneGrid.Tone
     * -------------
     * @class Oscillator wrapper
     */
    ToneGrid.Tone = function(){
        this.init.apply(this, arguments);
    };

    (function(){
        var api = ToneGrid.Tone.prototype;

        api.defaults = {
            easing: 8,
            frequency: 440,
            type: "sine"
        };

        api.index = null;
        api.playing = false;
        api.ctx = null;
        api.osc = null;
        api.gain = null;
        api.timer = null;
        api.flag = false;

        /**
         * Constructor
         * @param {Integer} index
         * @param {Object} options
         */
        api.init = function(index, options){
            u.events(this);
            u.config(this);
            u.rebase(this, ["process", "onChange"]);

            if(! ToneGrid.context){
                ToneGrid.context = new AudioContext();
            }

            // props
            this.index = index;
            this.ctx = ToneGrid.context;
            this.osc = this.ctx.createOscillator();
            this.gain = this.ctx.createGain();

            // connect
            this.osc.connect(this.gain);
            this.gain.connect(this.ctx.destination);
            this.gain.gain.value = 0;

            // configure
            this.on("change", this.onChange);
            this.config(options);

            this.play();
        };

        /**
         * Handler: changing options
         * @param {Event} e
         * @param {Object} o
         */
        api.onChange = function(e, o){
            if(!! this.osc){
                switch(o.key){
                    case "frequency":
                        this.osc.frequency.value = o.value;
                        break;
                    case "type":
                        this.osc.type = o.value;
                        break;
                    default: break;
                }
            }
            return this;
        };

        /**
         * Start sounding
         */
        api.play = function(){
            this.osc.start(0);
            this.playing = true;
            this.process();
        };

        /**
         * Stop sounding
         */
        api.stop = function(){
            this.playing = false;
        };

        /**
         * Toggle gain
         */
        api.tone = function(){
            this.flag = true;
        };

        /**
         * Handler: Process for changing gain
         */
        api.process = function(){
            var e, gain;

            e = this.options.easing;

            clearTimeout(this.timer);
            if(this.playing){
                this.timer = setTimeout(this.process, 10);
                if(this.flag){
                    this.gain.gain.value = 1;
                    this.flag = false;
                    return;
                } 
                gain = u.round(this.gain.gain.value * e / (e+1), 4);
                if(gain !== this.gain.gain.value){
                    this.gain.gain.value = gain;
                }
            }
        };

    }());

    /**
     * Utilities
     * ---------
     */
    var u = {

        /**
         * Get whether iOS or not
         * @returns {Boolean}
         */
        iOS: function(){
            return /(iPhone|iPad)/.test(navigator.userAgent);
        },

        // Apply config feature to object
        /**
         * Apply configure feature to object
         * @param {Object} obj
         */
        config: function(obj){
            obj.config = function(/* key|options, value */){
                var args, my;

                args = Array.prototype.slice.call(arguments);
                my = this;
                this.options = this.options ? this.options : $.extend({}, this.defaults);

                switch($.type(args[0])){
                    case "string":
                        if(args.length < 2){
                            return this.options[args[0]];
                        } 
                        if(this.options[args[0]] !== args[1]){
                            this.options[args[0]] = args[1];
                            this.trigger("change", {key: args[0], value: args[1]});
                        }
                        return this.options;
                    case "object":
                        $.each(args[0], function(key, value){
                            my.config(key, value);
                        });
                        return this.options;
                    case "undefined":
                        return this.options;
                    default: break;
                }
                return this.options;
            };
        },

        /**
         * Apply event feture to object
         * - Specify emitter property's name by `prop`
         * @param {Object} obj
         * @param {String} prop
         */
        events: function(obj, prop){
            prop = prop || "_emitter_";
            obj[prop] = $(obj);
            ["on", "off", "trigger"].forEach(function(name){
                obj[name] = function(){
                    this[prop][name].apply(this[prop], arguments);
                    return this;
                }
            });
        },

        /**
         * Return formatted string
         * @param {String} template
         * @param {String} arg1, arg2 ...
         */
        format: function(/* template, arg1, arg2, arg3 ... */){
            var args = Array.prototype.slice.call(arguments);
            return args.shift().replace(/%s/g, function(){
                return args.length ? args.shift() : "";
            });
        },

        /**
         * Call function by `count` times
         * @param {Integer} count
         * @param {Function} callback
         */
        times: function(count, callback){
            for(var i=0; i<count; i++){ callback(i); }
        },

        /**
         * Bind methods to object
         * @param {Object} obj
         * @param {Array} props
         */
        rebase: function(obj, props){
            props.forEach(function(name){
                obj[name] = obj[name].bind(obj);
            });
        },

        /**
         * Get last value from array
         * @param {Array}
         * @returns {*}
         */
        last: function(list){
            return list[list.length - 1];
        },

        /**
         * Get repeated string by `count` times
         * @param {String} str
         * @param {Integer} count
         */
        repeat: function(str, count){
            var r = "";
            while(count--){
                r += str;
            }
            return r;
        },

        /**
         * Round number by place
         * @param {Number} num
         * @param {Integer} place
         */
        round: function(num, place){
            var a = parseInt("1" + u.repeat("0", place));
            return parseInt(num * a, 10) / a;
        },

        /**
         * Return new array|object filtered by callback function
         * @param {Object|Array} 
         * @param {Function} callback
         */
        filter: function(obj, callback){
            var res = {};
            $.each(obj, function(key, value){
                if(true === callback(value, key)){
                    res[key] = value;
                }
            });
            return res;
        }
    };

    global.ToneGrid = ToneGrid;

}(jQuery, this));