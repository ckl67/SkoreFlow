# DOM (Document Object Model)

[← back](../doc.md)

The DOM [Document Object Model](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) is the bridge between a web page and your code (JavaScript).
Here is the breakdown:

- The Blueprint: When a browser loads your HTML, it creates a "live" map of the page.
- The Tree Structure: It organizes every element into a hierarchical tree of objects.

  ```html
  <div>
    <h1>header</h1>
    <p>paragraph.</p>
  </div>
  ```

- The Remote Control: JavaScript uses the DOM to change, add, or delete elements on the fly without refreshing the page.

Key Difference:

- HTML: Is the static text file you write.
- DOM: Is the dynamic, interactive version living in the browser's memory.

## Analogy of DOM

The DOM (Document Object Model) is not a language.
It is an in-memory representation (a data structure) of your HTML document, exposed as an API (application programming interface).

Analogy:

- HTML is the architect’s plan (a text file).
- The DOM is the house built in the browser’s memory.
- JavaScript is the builder who comes along to add a room, paint a wall or knock down a wall by directly manipulating the house (the DOM).

### Source code

- written in HTML, TypeScript, React, Vue, Svelte…

### Compilation / Translation

- The HTML is a transport format. It is a simple, static text file that the server sends to the browser.
  - As soon as the browser downloads this file:
    - It reads it from top to bottom (parsing).
    - It creates the C++ objects in memory (the DOM).
    - The plain text HTML file is removed - It no longer exists in the active operation of your page.
  - From that perspective, what you see on the screen is no longer HTML: it is the live DOM that the browser maintains in memory.

- TypeScript is converted into standard JavaScript.

- React (JSX) uses its ‘Virtual DOM’ to calculate what has changed, then generates native JavaScript instructions.

### Execution

- The browser takes this JavaScript and calls the DOM API methods
  - document.createElement(), appendChild(), addEventListener(), etc.

### Result

- The DOM in memory is updated, and the browser’s rendering engine draws the pixels on the screen.

Regardless of the framework or programming language used,
--> the browser understands only : HTML, CSS, JavaScript and the DOM API.
--> But : As for the structural part of your page, it ALWAYS ends up as DOM.

## Why has this become such a key topic today?

Before SPA, the DOM was created from scratch every time the page was reloaded (PHP) , and then discarded. You didn’t need to manipulate it.
With SPAs (Single Page Applications) and frameworks such as React, Angular and Vue (in the years 2010–2015) changed everything:

- The page is no longer reloaded: the server sends an almost empty HTML page and a large JavaScript file.
- The client (browser) does all the work: JavaScript creates, destroys and modifies visual elements directly in memory, in real time.
- Intensive DOM manipulation: As we modify the DOM thousands of times per second in response to user actions, DOM performance (and React’s invention of the Virtual DOM) have become major concerns for developers.

## Create a web page without any HTML, using only JS / DOM?

Absolutely, it’s entirely possible!

Here’s what a web page built entirely using the DOM API would look like, without writing a single tag in your HTML file (apart from an empty file containing a script):

```javascript
// Creating the <h1> heading
const titre = document.createElement('h1');
titre.textContent = 'Bonjour tout le monde !';
titre.style.color = 'blue';

// Creating the <button> button
const button = document.createElement('button');
button.textContent = 'Click hear';
button.addEventListener('click', () => {
  alert('Button clicked !');
});

// Inserting elements directly into the <body> element of the DOM
document.body.appendChild(titre);
document.body.appendChild(button);
```

In summary: HTML is the markup language for humans, and the DOM is the final structure manipulated by the browser.

## In summary

- HTML: The text format used for descriptions (to load the initial page).
- JavaScript: The programming language.
- DOM: The interface (the object tree) that JavaScript uses to dynamically change what is displayed.

## Follow up

### What you write in React (JSX)

In React, you write syntax that looks like HTML (JSX):

```javascript
function MyComponent() {
  return (
    <div className="carte">
      <h1>Bonjour !</h1>
      <button onClick={() => alert('Click !')}>Action</button>
    </div>
  );
}
```

The browser does not recognize this syntax.

### The transformation (Babel / Compiler)

Before it reaches the browser, a compilation tool (such as Babel or Vite) transforms the JSX into plain JavaScript using React functions:

```javascript
// What the browser actually receives
function MyComponent() {
  return React.createElement(
    'div',
    { className: 'carte' },
    React.createElement('h1', null, 'Bonjour !'),
    React.createElement('button', { onClick: () => alert('Clic !') }, 'Action')
  );
}
```

At this stage, React.createElement does not yet interact with the DOM.
It simply creates a lightweight JavaScript object (the Virtual DOM) that describes what the interface should look like.

### Final execution (the DOM API)

When React decides to display this component on screen, its rendering engine (react-dom) takes these objects and executes the actual native browser DOM API calls:

```javascript
// What React does in the background in the browser:
const div = document.createElement('div');
div.className = 'carte';

const h1 = document.createElement('h1');
h1.textContent = 'Bonjour !';

const button = document.createElement('button');
button.textContent = 'Action';
button.addEventListener('click', () => alert('Click !'));

// Insert into the page
div.appendChild(h1);
div.appendChild(button);
document.body.appendChild(div);
```
