;
(function (name, definition) {
    if (typeof define === 'function' && typeof define.amd === 'object') {
        define(definition);
    } else if (typeof module !== 'undefined') {
        module.exports = definition();
    } else {
        this[name] = definition();
    }
}("EventEmitter", function () {

    /**
     * @argument {object} options 
     *  * callback : function
     *  * event : 
     *  * arg :
     *  * err|error :
     */
    let EventError = function (options = {}){
        this.event = options.event || "";
        this.arg = options.arg;
        this.callback = options.callback;
        this.err = this.error = options.err || options.error;
        let msg = (this.err && this.err.message) || "";
        msg = "[EventError \"" + this.event + "\"<" + this.arg + ">]: " + msg;
        this.message = msg;

        this.toString = function () {
            return this.message;
        };
        this.toJSON = function () {
            return {
                message: this.message,
                event: this.event,
                arg: this.arg,
                err: (this.err && this.err.toJSON && this.err.toJSON.apply(this.err, arguments)) || undefined
            };
        };
    };
    EventError.prototype = new Error();

    /**
     * @description EventEmitter constructor
     * 
     * ## Namespace
     * 
     * If an EventEmitter is set as a prototype, the listeners and proxy will be relative to the descendant only. 
     * The namespace however, will be shared between all instances.
     * 
     * ## Async 
     * 
     * The Event (`.on(), .off(), .once(), .emit()`) API of EventEmitter is asynchronous. That is, 
     * when any method of this interface is called, the operation is qeued behind all previous 
     * operation and will only be executed after completion of all previous operation.
     * 
     * ## Error
     * 
     * When emitting an event, an error could be thrown by a callback, this error will be intercepted
     * and an "error" event will be emitted with the Error object, the callback responsible and the 
     * event concerned : `"error" -> {err: ,callback: ,event: }`
     * 
     * @param {String} _namespace 
     * 
     * @returns {EventEmitter}
     */
    var EventEmitter = function (_namespace) {
        this._last = null;
        this._listeners = {};
        let namespace = _namespace ? (_namespace + ":") : "";
        Object.defineProperty(this, "namespace", {
            value: _namespace,
            writable: false
        });


        /**
         * @description Register a new listener on an event. The special event "all" allows to listen 
         * for any event (even internal events) that the emitter may emit.
         * 
         * *Note : If the emitter is namespaced and the event is not, only proxied events could be listened to.* 
         * 
         * @param {string} event
         * @param {function} callback : May be passed **one** optional argument
         * @returns {EventEmitter} this
         */
        this.on = function (event, callback) {
            if (typeof event === "string" && typeof callback === "function") {
                let that = this;
                let operation = function () {
                    if (!that._listeners[event]) {
                        that._listeners[event] = [];
                    }
                    that._listeners[event].push(callback);
                    if (operation.next) {
                        operation.next();
                    } else if (operation === that._last) {
                        that._last = null;
                    }
                };
                if (that._last) {
                    that._last.next = operation;
                    that._last = operation;
                } else {
                    operation();
                }
            }
            return this;
        };


        /**
         * @description Unregister either a callback on a specified event (if both arguments are specified), 
         * either a callback (if only the callback argument was set), either all the callbacks on a given 
         * event (if only the event argument was specified), either all this emitter listeners (if no argument 
         * was passed).
         * 
         * @param {string} event *optional*
         * @param {function} callback *optional*
         * @returns {EventEmitter} this
         */
        this.off = function (event, callback) {
            let that = this;
            let operation = function () {
                if (typeof event === "string") {
                    let node = that._listeners[event];
                    if (node) {
                        if (typeof callback === "function") {
                            var index = node.indexOf(callback);
                            while (index > -1) {
                                node.splice(index, 1);
                                index = node.indexOf(index, callback);
                            }
                        } else {
                            delete that._listeners[event];
                        }
                    }
                } else if (typeof event === "function") { // depth first search ?
                    callback = event;
                    for (var node in listeners) {
                        var index = node.indexOf(callback);
                        while (index > -1) {
                            node.splice(index, 1);
                            index = node.indexOf(index, callback);
                        }
                    }
                } else { // Remove everything
                    that._listeners = {};
                }
                if (operation.next) {
                    operation.next();
                } else if (operation === that._last) {
                    that._last = null;
                }
            };
            if (that._last) {
                that._last.next = operation;
                that._last = operation;
            } else {
                operation();
            }
            return this;
        };

        /**
         * @description Like on() but the listener will automatically be removed after it is fired once.
         * 
         * @param {string} event
         * @param {function} callback
         * @returns {EventEmitter} this
         */
        this.once = function (event, callback) {
            if (typeof event === "string" && typeof callback === "function") {
                let that = this;
                let obj = {};
                let flag = false;
                obj.callback = function () {
                    if (!flag) {
                        flag = true;
                        that.off(event, obj.callback);
                        callback.apply({}, arguments);
                    }
                };
                this.on(event, obj.callback);
            }
            return this;
        };


        /**
         * @description Emit an event with the optional argument `arg`. The `options`
         * argument was originally designed to be used internally only, but it can safely 
         * be used by end users. 
         * 
         * @param {string} event
         * @param {?} arg
         * @param {object} options : 
         *  * {boolean} ignoreNamespace *optional (default : false)* : This event will not be namespaced before being fired 
         *    (useful for the proxy API where events are already namespaced)
         * @param {function<array<EventError>>} callback : Callback executed right after the event is emitted, this is useful since the 
         * listener could emit other events while this one is being emitted. Note that no error will be thrown if a callback is specified
         * instead, an array of error will be passed as the callback first argument.
         * 
         * @returns {Promise<array<EventError>>} A Promise if no callback is passed
         */
        this.emit = function (event, arg, options = {}, callback) {
            if (!callback && typeof options === "function") {
                callback = options;
                options = {};
            }
            if (!callback) {
                let that = this;
                return new Promise(function (resolve, reject) {
                    that.emit(event, arg, options, function (errs) {
                        if (errs && errs.length > 0) {
                            console.error("EventEmitter swallowed: ", errs);
                            reject(errs);
                        } else {
                            resolve();
                        }
                    });
                });
            }


            let errs = [];

            if (!options.ignoreNamespace && namespace) {
                event = namespace + event;
            }

            let that = this;
            let operation = function () {
                if (that._listeners.all) { // For the all listener, fire the event with the event name as the first argument
                    for (let callback of that._listeners.all) {
                        try {
                            callback(event, arg, options.emitter);
                        } catch (err) {
                            errs.push(new EventError({
                                err: err,
                                callback: callback,
                                event: event,
                                arg: arg
                            }));
                        }
                    }
                }

                node = that._listeners[event] || [];
                for (let callback of node) {
                    try {
                        callback(arg, options.emitter);
                    } catch (err) {
                        errs.push(new EventError({
                            err: err,
                            callback: callback,
                            event: event,
                            arg: arg
                        }));
                    }
                }

                try {
                    callback(errs.length > 0 ? errs : null);
                } catch (err) {  // We have to eat the errors from the callback to ensure that the event flow remain uninterrupted

                }

                if (operation.next) {
                    operation.next();
                } else if (operation === that._last) {
                    that._last = null;
                }
            };

            if (that._last) {
                that._last.next = operation;
                that._last = operation;
            } else {
                operation();
        }
        };

        /**
         * ## Proxy API
         * 
         * Proxy all events from the registered emitters (even the internal 
         * events such as error. The registered emitter namespace is preserved.
         *  
         * The proxied emitters are kept in a weakmap to not impede their GC.
         * 
         * An emitter can only be proxied once and cannot proxy itself.
         * 
         */
        this._proxies = new WeakMap();

        /**
         * @description Proxy all events from an EventEmitter through this one. The original EventEmitter namespace will 
         * be preserved.
         * 
         * @param {EventEmitter} emitter
         * @returns {EventEmitter} this
         */
        this.proxy = function (emitter) {
            if (this._proxies.has(emitter) || emitter === this) {
                return;
            }
            let that = this;
            let callback = function (event, arg) {
                that.emit(event, arg, {
                    ignoreNamespace: true,
                    emitter: emitter
                });
            };
            emitter.on("all", callback);
            this._proxies.set(emitter, callback);
            return this;
        };

        /**
         * @description Unproxy an EventEmitter
         * 
         * @param {EventEmitter} emitter
         * @returns {EventEmitter} this
         */
        this.unproxy = function (emitter) {
            let callback = this._proxies.get(emitter);
            if (callback) {
                emitter.off("all", callback);
            }
            this._proxies.delete(emitter);
            return this;
        };
    };
    EventEmitter.emancipate = function (obj) {
        obj._last = null;
        obj._listeners = {};
        obj._proxies = new WeakMap();
    };

    /**
     * 
     * @description EventListener constructor
     * 
     * ## Refences and Garbage collector
     * To allow the GC to properly collect emitters which are listened to, those are stored in a WeakMap. 
     * 
     * @returns {EventListener} 
     */
    let EventListener = function () {
        this._emitters = new WeakMap();

        /**
         * @description Listen to an event on a given EventEmitter.
         * 
         * @param {EventEmitter} emitter
         * @param {string} event
         * @param {function} callback
         * @returns {EventListener} this
         * 
         * @throws {Error} If an argument is invalid
         */
        this.listenTo = function (emitter, event, callback) {
            if (!emitter.on || !emitter.off) {
                throw new Error("Invalid emitter");
            } else if (typeof event !== "string") {
                throw new Error("Invalid event");
            } else if (typeof callback !== "function") {
                throw new Error("Invalid callback");
            }

            let listeners = this._emitters.get(emitter);

            if (!listeners) {
                listeners = {};
                this._emitters.set(emitter, listeners);
            }

            if (!listeners[event]) {
                listeners[event] = [];
            }

            listeners[event].push(callback);
            emitter.on(event, callback);

            return this;
        };

        /**
         * @description Stop to listen on 'something' determined by the following combinations of the three arguments.
         * * emitter, event, callback : Remove this callback from this event in this emitter
         * * emitter, event : Remove every callback from this event in this emitter
         * * emitter, callback : Remove this callback from every event in this emitter 
         * * emitter : Remove every callback from every event in this emitter
         * 
         * *Note: We can not operate on every emitter listened to at the same time (for instance, removing a callback from 
         * all emitters at once) since the elements of a weakmap cannot be walked throught.*
         * 
         * 
         * @param {EventEmitter} emitter
         * @param {string} event
         * @param {function} callback
         * @returns {EventListener} this
         */
        this.stopListeningTo = function (emitter, event, callback) {
            let listeners = this._emitters.get(emitter);

            if (typeof event === "string") {
                var callbacks = listeners[event];
                if (!callbacks) {
                    return this;
                }

                if (typeof callback === "function") { // remove this callback from this event in this emitter
                    for (var i = 0; i < callbacks.length; i++) {
                        if (callbacks[i] === callback) {
                            emitter.off(event, callback);
                            callbacks.splice(i, 1);
                            i--;
                        }
                    }
                    // Cleanup
                    if (callbacks.length === 0) {
                        delete listeners[event];
                    }
                } else { // remove every callback from this event in this emitter
                    for (var i = 0; i < callbacks.length; i++) {
                        emitter.off(event, callbacks[i]);
                    }
                    delete listeners[event];
                }

            } else if (typeof event === "function") { // remove this callback from every event in this emitter
                callback = event;
                for (let event in listeners) {
                    var callbacks = listeners[event];
                    for (var i = 0; i < callbacks.length; i++) {
                        if (callbacks[i] === callback) {
                            emitter.off(event, callback);
                            callbacks.splice(i, 1);
                            i--;
                        }
                    }

                    // cleanup
                    if (callbacks.length === 0) {
                        delete listeners[event];
                    }
                }
            } else { // remove every callback from every event in this emitter
                for (let event in listeners) {
                    let callbacks = listeners[event];
                    for (var i = 0; i < callbacks.length; i++) {
                        emitter.off(event, callbacks[i]);
                    }
                }
                this._emitters.delete(emitter);
            }
        };
    };
    EventListener.emancipate = function (obj) {
        obj._emitters =  new WeakMap();
    };
    EventEmitter.EventListener = EventListener;

    return EventEmitter;
}));






