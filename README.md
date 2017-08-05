# EventEmitter


## Synopsis - Interface

An extended implementation of the observer pattern.

This component can be used both in the browser and node.js (the module definition is done in AMD style, node style or as a browser global)

This component defines two different classes `EventEmitter` and `EventListener`. The `EventEmitter` class exposes two interfaces, the **emitter** interface -`on`, `off`, `once`, `emit`- and the **proxy** interface - `proxy`, `unproxy`. 
The `EventListener` class expose a single **listener** -`listenTo`, `stopListeningTo`- interface. 
*A second interface, **records**, is in progress on `EventListener`*


## Code Example

```javascript
/* Create a new EventEmitter */
let emitter = new EventEmitter();

/* Add a listener */
emitter.on("event", function (arg) {
    console.log("event emitted with arg: ", arg);
});

/* Emit an event */
emitter.emit("event", "argument");

/* todo */
```

## Motivation

After research, I wasn't satisfied by the implementations of EventEmitter I could find. Of all browser+node.js implementations I could find, none was both concise and complete enough. 

## Installation

```
npm install marcus-timtow/EventEmitter
```
*todo: minify*
*todo: bower*

## Interfaces (API)

### EventEmitter - The **emitter** interface

#### EventEmitter.on & EventEmitter.once
```
on: function<event: string, callback: function<[event: string], arg = undefined, emitter>>: EventEmitter
once: function<event: string, callback: function<[event: string], arg = undefined, emitter>>: EventEmitter
``` 
Register a new listener callback on an event. The special event `"all"` can be used to listen for any event that the emitter may emit. **The `"all"` event listener callbacks will be passed a first additional argument, the event name.**
The `once` method is basically `on` but will only be fired once before being unregistered from the emitter

#### EventEmitter.off
```
off: function<[event: string][, callback: function]>: EventEmitter
```
Unregister a listener.
 * If only the `event` argument is specified, all callbacks registered on this specific event will be unregistered.
 * If only the `callback` argument is specified, this specific callback will be unregistered from all events it may be registered to.
 * If both `event` and `callback` are specified, the callback is unregistered only from this specific event.

#### EventEmitter.emit
```
emit: function<event: string, arg = undefined[, options][, callback: function<errs: array<EventError>>]): EventEmitter
```
Emit an event and pass an optional argument `arg` to the listener callbacks. 
An `options` object can be passed as a **third** argument (it will be interpreted as `arg` if passed as second argument). `options` contains detail of the firing process:
 * `ignoreNamespace: boolean = false` Do not prepend the emitter namespace (if any) to the event. (used by the proxy interface)
 * `emitter: EventEmitter = undefined` Pass the emitter as a second (third for the `"all"` event) argument of the listeners callbacks. (used by the procy interface)
 * `errorHandler: function<err: ErrorHandler> = console.error` called if listeners callbacks throw errors.

### EventEmitter - The **proxy** interface

#### EventEmitter.proxy & EventEmitter.unproxy
```
proxy: function<emitter: EventEmitter>: EventEmitter
unproxy: function<emitter: EventEmitter>: EventEmitter
```
Proxy/Unproxy all the events from a second emitter through this one. The original emitter namespace will preserved.
All listener callbacks fired due to a proxied emitter will be passed a reference to the orignal emitter as a second argument (third argument in the case of the `"all"` event).

### EventListener - The **listener** interface

The interest of extending a class with an EventListener is that EventListener will automatically keep track of the emitters listened to via the `listenTo` method (as opposed to directly use the emitter interface). As such all events registered to can be freed at once (or speraratedly) via the `stopListeningTo` method.

#### EventListener.listenTo & EventListener.stopListeningTo
```
listenTo: function<emitter: EventEmitter, event: string, callback: function<[event: string], arg = undefined, emitter>>: EventListener
stopListeningTo: function<emitter: EventEmitter[, event: string][, callback: function]>: EventListener
```
Register to an event just like `on` but keep track of it for later unregisteration.
`stopListeningTo` behavior depends on its arguments:
 * If `emitter`, `event` and `callback` are specified the only matching callback will be unregistered.
 * If `emitter` and `event` are specified
 * If `emitter` and `event` are specified
 * If only `emitter` is specified
 * **emitter must always be specified, since EventListener use a WeakMap to internally store the emitters listened to EventListener cannot automatically retrieve. TODO: This behavior may be changed via an option.**

### **Draft**: EventListener - The **record** interface

 * `startRecord: function<>: Record`
 * `Record.stop<>: Record`
 * `Record.rollback<>`
 
### Instanciation & Inheritance

Inheriting from the EventEmitter/EventListener classes require certain precautions:
```javascript
/* Direct instanciations */
let emitter = new EventEmitter(); 
let obj = {}; EventEmitter.call(obj);

/* Inheritence */
let MyEventEmitter = function(){
    EventEmitter.emancipate(this);
    /* ... */
};
MyEventEmitter.prototype = new EventEmitter();

let MyWhateverEventEmitter = function(){
    EventEmitter.emancipate(this);
    /* ... */
};
MyWhateverEventEmitter.prototype = new Whatever();
EventEmitter.call(MyWhateverEventEmitter.prototype);
```

```
EventEmitter.emancipate<emitter: EventEmitter>: EventEmitter
EventListener.emancipate<listener: EventListener>: EventListener
```

When an object inherits from an EventEmitter or EventListener (higher in the prototypal chain), the listeners, operations, proxies and emitters stored internally are shared by all instances sharing this emitter in their prototypal chain. This is usually undesired behavior, hence, the `emancipate` static method can be called on any instances to keep those private. *Note that all previously proxied emitter, registered listener and emitters will be forgotten by this specific instance.*


## Contributors

*todo: interface suggestions*

## License

Copyright 2017 Marcus Timtow

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

