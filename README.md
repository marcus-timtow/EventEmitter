# EventEmitter


## Synopsis - Interface

An extended implementation of the observer pattern.

This component can be used both in the browser and node.js (the module definition is done in AMD style, node style or as a browser global)

This component defines two different classes `EventEmitter` and `EventListener`. The `EventEmitter` class exposes two interfaces, the **emitter** interface -`on`, `off`, `once`, `emit`- and the **proxy** interface - `proxy`, `unproxy`. 
The `EventListener` class expose a single **listener** interface. 
*A second interface, **records**, is in progress on `EventListener`*


## Code Example

        /* Create a new EventEmitter */
        let emitter = new EventEmitter();
        
        /* Add a listener */
        callback = function(arg){
            console.log("event emitted with arg: ", arg);
        };
        emitter.on("event", callback);
        emitter.on("all", function(event, arg){/*...*/});
        emitter.on("event", function(arg, emitter){/*...*/});
        emitter.once("event", function(arg){/*...*/});
        
        /* Remove a listener */
        emitter.off("event", callback);
        emitter.off("event");
        emitter.off(callback);
        emitter.off();
        
        /* Emit an event */
        emitter.emit("event");
        emitter.emit("event", "argument");
        emitter.emit("event", null, {
            errorHandler: console.error,
            ignoreNamespace: true
        });
        emitter.emit("event", null, {},  function(errs){/*...*/});
        emitter.emit("event").then(function(){/*...*/}, function(errs){/*...*/});
        
        /* todo */
        /* todo: shorten the code example, document the API reference */
        /* todo: inheritance */
        

## Motivation

After research, I wasn't satisfied by the numerous implementation of EventEmitter. Of all browser+node.js implementations, none was both concise but complete enough for my taste.

## Installation

/* todo: minify + npm, bower, ... */

## API Reference

/* todo */


## Contributors

/* todo: interface suggestions */

## License

Copyright 2017 Marcus Timtow

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

