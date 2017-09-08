;
(function (name, definition) {
    if (typeof define === "function" && typeof define.amd === "object") {
        define(definition);
    } else if (typeof module !== "undefined") {
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
    let EventError = function (options){
        options = options || {};
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
     * When an emitter is namespaced, for instance with "namespace", all the events 
     * it emits will be prepended "namespace:". Note that the proxied events will not 
     * be namespaced.
     * 
     * @todo It would be possible to add an `options` argument to the `proxy()` interface for such 
     * purpose if need were to be.
     * 
     * ## Operation Queue 
     * when a method of the main event interface - `on()`, `off()`, `once()`, `emit()` - is called, 
     * the operation is qeued behind all previous unfinished operations and will 
     * only be executed after completion of the current operation and all the previously queued operation.
     * 
     * ## Error
     * When emitting an event, an error may be thrown by a listener callback, such error will be swallowed
     * by the emitter and the remaining callbacks will be normally called. If the global optional 
     * errorHandler is specified, it will be called on such errors
     * 
     * @param {string} namespace 
     * @param {object} options 
     *  * namespace: string
     *  * errorHandler: function<err: EventError> = console.error
     * 
     * @returns {EventEmitter}
     */
    var EventEmitter = function (namespace, options) {
        if (typeof namespace === "object") {
            options = namespace;
            namespace = options.namespace || null;
        }
        options = options || {};

        this._errorHandler = options.errorHandler || console.error.bind(console);
        this._last = null;
        this._listeners = {};

        this.namespace = namespace;
        Object.defineProperty(this, "_namespace", {
            get: function () {
                return this.namespace ? (this.namespace + ":") : "";
            }
        });


        /**
         * @description Register a new listener on an event. The special event "all" can be used to listen 
         * for any event that the emitter may emit. The "all" event listeners callback will be 
         * passed a first additional argument, the event name.
         * 
         * 
         * @param {string} event
         * @param {function<arg, emitter>|function<event, arg, emitter>} callback
         * @returns {EventEmitter} this
         */
        this.on = function (event, callback) {
            if (typeof event !== "string" || typeof callback !== "function") {
                throw new Error("Invalid event: " + event + " or callback: " + callback);
            }
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
            return this;
        };


        /**
         * @description Unregister either a specific callback from a specific event (if both arguments are specified), 
         * either a specific callback from all events (if only the callback argument was set), either all the callbacks on a specific 
         * event (if only the event argument was specified), either all the listeners (if no argument 
         * was passed).
         * 
         * @param {string} event
         * @param {function} callback
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
                } else if (typeof event === "function") {
                    callback = event;
                    for (var event in that._listeners) {
                        let node = that._listeners[event];
                        var index = node.indexOf(callback);
                        while (index > -1) {
                            node.splice(index, 1);
                            index = node.indexOf(index, callback);
                        }
                    }
                } else {
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
         * @description Like `on()` but the listener will automatically be removed after being fired once.
         * 
         * @param {string} event
         * @param {function} callback
         * @returns {EventEmitter} this
         */
        this.once = function (event, callback) {
            if (typeof event !== "string" || typeof callback !== "function") {
                throw new Error("Invalid event: " + event + " or callback: " + callback);
            }
            let that = this;
            let flag = false;
            let _callback = function (event, arg, emitter) {
                if (!flag) {
                    flag = true;
                    try {
                        callback(event, arg, emitter);
                    } catch (err) {
                        that.off(event, _callback);
                        throw err;
                    }
                    that.off(event, _callback);
                }
            };
            this.on(event, _callback);
            return this;
        };


        /**
         * @description Emit an event with one optional argument `arg`.
         * 
         * @param {string} event
         * @param {?} arg
         * @param {object} options : 
         *  * {boolean} ignoreNamespace = false : This event will not be namespaced (used by the proxy API)
         *  * {function<err: EventError>} errorHandler 
         *  * {EventEmitter} emitter : Used by the proxy interface. This option will pass a second/third argument
         *    to the listeners callbacks - the original emitter.
         * @param {function<array<EventError>>} callback : Callback executed directly after the event is emitted (after all 
         * listener callbacks have been executed), this callback is useful beause other events could be emitted
         * while this one is being emitted, and even though they would be chained, they would be executed before `emit()` 
         * returns which can be an issue when we want to make sure to execute some routine before any other listener manipulate 
         * the emitter. Note all errors thrown by the callbacks will be passed to the callback (ot the retunred promise).
         * 
         * @returns {Promise<array<EventError>>} A Promise if no callback is passed
         */
        this.emit = function (event, arg, options, callback) {
            if (!callback && typeof options === "function") {
                callback = options;
                options = {};
            }
            options = options || {};
            if (!callback) {
                let that = this;
                return new Promise(function (resolve, reject) {
                    that.emit(event, arg, options, function (errs) {
                        if (errs && errs.length > 0) {
                            reject(errs);
                        } else {
                            resolve();
                        }
                    });
                });
            }


            let errs = [];

            if (!options.ignoreNamespace && this._namespace) {
                event = this._namespace + event;
            }

            let that = this;
            let operation = function () {
                if (that._listeners.all) { // For the all listener, fire the event with the event name as the first argument
                    for (let callback of that._listeners.all) {
                        try {
                            callback(event, arg, options.emitter);
                        } catch (err) {
                            err = new EventError({
                                err: err,
                                callback: callback,
                                event: event,
                                arg: arg
                            });
                            options._errorHandler && options._errorHandler(err);
                            that._errorHandler && that._errorHandler(err);
                            errs.push(err);
                        }
                    }
                }

                node = that._listeners[event] || [];
                for (let callback of node) {
                    try {
                        callback(arg, options.emitter);
                    } catch (err) {
                        err = new EventError({
                            err: err,
                            callback: callback,
                            event: event,
                            arg: arg
                        });
                        options._errorHandler && options._errorHandler(err);
                        that._errorHandler && that._errorHandler(err);
                        errs.push(err);
                    }
                }

                callback(errs.length > 0 ? errs : null);

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
         * Proxy all events from the registered emitters. The registered emitter namespace is preserved.
         * An emitter can only be proxied once and cannot proxy itself. *This method is idempotent.*
         *  
         * The proxied emitters are kept in a weakmap to not impede their GC.
         * 
         * @todo : We could easily set up an option to use a Map instead of a WeakMap to prevent the emitters to be GC.
         * 
         */
        this._proxies = new WeakMap();

        /**
         * @description Proxy all events from an EventEmitter through this one. The original emitter namespace will 
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
            callback && emitter.off("all", callback);
            this._proxies.delete(emitter);
            return this;
        };
    };
    /**
     * When an object inherits from an EventEmitter (higher in the prototypal chain), the 
     * listeners, operations and proxies are shared by all instances which share this emitter
     * in their prototypal chain. This is usually an undesired behavior, hence, this routine 
     * can be called on any instances to keep those private. 
     * 
     * *Note that all previously proxied emitter and registered listener will be forgotten by this
     * specific instance*
     * 
     * @param {EventEmitter} descendant
     * @returns {EventEmitter} descendant
     */
    EventEmitter.emancipate = function (descendant) {
        descendant._last = null;
        descendant._listeners = {};
        descendant._proxies = new WeakMap();
        return descendant;
    };

    /**
     * 
     * @description EventListener constructor
     * 
     * ## Refences and Garbage collector
     * To allow the GC to properly collect emitters which are listened to, those are stored in a WeakMap. 
     * 
     * @todo Records:
     *         .startRecord(recordId)
     *         .stopRecord(recordId)
     *         .stopListeningTo(recordId)
     * 
     * @returns {EventListener} 
     */
    let EventListener = function () {
        this._emitters = new WeakMap();

        /**
         * @description Listen to an event on a given emitter.
         * 
         * @todo We should make the event optional, with a default value of "all" 
         * to listen to all events from an emitter
         * @todo We should support arrays of events.
         * 
         * @param {EventEmitter} emitter
         * @param {string} event
         * @param {function} callback
         * @returns {EventListener} this
         * 
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
         * @description Stop to listen to *something* determined by the following combinations of arguments:
         * * emitter, event, callback : Remove a specific callback from a specific event on a specific emitter
         * * emitter, event : Remove every callback from a specific event on a specific emitter
         * * emitter, callback : Remove a specific callback from every event on a specific emitter 
         * * emitter : Remove every callback from every event on a specific emitter
         * 
         * *Note: We can not operate on every emitter listened to at the same time (for instance, removing a specific callback from 
         * all emitters at once) since the elements of a WeakMap cannot be walked throught.*
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

                if (typeof callback === "function") { // remove a specific callback from a specific event in a specific emitter
                    for (var i = 0; i < callbacks.length; i++) {
                        if (callbacks[i] === callback) {
                            emitter.off(event, callback);
                            callbacks.splice(i, 1);
                            i--;
                        }
                    }
                    if (callbacks.length === 0) {
                        delete listeners[event];
                    }
                } else { // remove every callback from a specific event in a specific emitter
                    for (var i = 0; i < callbacks.length; i++) {
                        emitter.off(event, callbacks[i]);
                    }
                    delete listeners[event];
                }

            } else if (typeof event === "function") { // remove a specific callback from every event on a specific emitter
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
                    if (callbacks.length === 0) {
                        delete listeners[event];
                    }
                }
            } else { // remove every callback from every event on a specific emitter
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
    /**
     * @see `EventEmitter.emancipate`
     * 
     * @param {EventEmitter} descendant
     * @returns {EventEmitter} descendant
     */
    EventListener.emancipate = function (descendant) {
        descendant._emitters = new WeakMap();
        return descendant;
    };
    EventEmitter.EventListener = EventListener;

    return EventEmitter;
}));
