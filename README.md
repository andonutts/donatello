# donatello

![flowers](img/banner.png "donatello")

## Usage

[Try it here!](https://andonutts.github.io/donatello/)

To use the program locally, simply clone or download the repository, then open `index.html` in a web browser. When running locally, you may have problems loading examples from `examples.json`. See [How to run things locally](https://threejs.org/docs/#manual/en/introduction/How-to-run-things-locally).

## Supported Commands

```
F, G     move forward, drawing a line
f        move forward without drawing a line
+        turn left
-        turn right
[        push the current state onto a pushdown stack
]        pop a state from the stack
&        pitch down
^        pitch up
\        roll left
/        roll right
|        turn around
L        generate a leaf
P        generate a flower petal
```

## References

* [The Algorithmic Beauty of Plants](http://algorithmicbotany.org/papers/#abop)
* [L-system - Wikipedia](https://en.wikipedia.org/wiki/L-system)