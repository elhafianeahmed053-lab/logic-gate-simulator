# Logic Gate Simulator

A Python tool and an interactive web page that simulate digital logic from the gate level down to the transistor level. It was built while studying Computer Architecture (gates and transistors). The Python tool needs only the standard library, and the web page needs no build step.

**Live page:** https://elhafianeahmed053-lab.github.io/logic-gate-simulator/ (available once GitHub Pages is turned on, see [Publish the web page](#publish-the-web-page))

## Features

- **Basic and derived gates:** NOT, AND, OR, NAND, NOR, XOR, XNOR and BUFFER, with multi-input AND/OR in Python.
- **Truth tables** for any gate or any custom Boolean expression.
- **Universal gates:** builds NOT, AND and OR from only NAND, and from only NOR, and checks them against the real gates.
- **CMOS simulation:** models nMOS and pMOS transistors as switches and builds NOT, NAND and AND, including the ON/OFF state of every transistor (pMOS in parallel and nMOS in series for NAND).
- **Safe expression parser:** custom expressions are parsed, never run as code, in both Python and JavaScript.
- **Web page:** flip gate inputs with switches, watch the wires and output light up, edit expressions live, and toggle the inputs of a CMOS circuit to see which transistors conduct.

## Python command line

Requires Python 3.8 or newer.

```bash
python main.py list
python main.py gate xor
python main.py expr "(not X and Y) or (X and not Y)"
python main.py universal
python main.py cmos
python main.py web
```

Example output of `python main.py gate xor`:

```
XOR gate
A B | XOR
---------
0 0 | 0
0 1 | 1
1 0 | 1
1 1 | 0
```

Expressions can use `and`, `or`, `not`, `^` (XOR), parentheses, the constants `0` and `1`, and variable names such as `A`, `B`, `X`, `Y`.

## Web page

Run `python main.py web` to serve the page on your computer and open it in your browser. Use `--port 8080` to pick another port, or `--no-browser` to skip opening a window. You can also open `index.html` through any static file server.

Every gate on the page shows the matching Python command, so you can compare the two versions side by side.

## Publish the web page

The page is plain HTML, CSS and JavaScript at the root of this repository, so GitHub Pages can serve it directly:

1. On GitHub, open the repository's **Settings**, then **Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose the **main** branch and the **/ (root)** folder, then save.
4. After a minute or two, the page is live at `https://<your-username>.github.io/logic-gate-simulator/`.

## Running the tests

```bash
python -m unittest -v     # Python logic, CMOS model, expression parser, web page wiring
node logic.test.js        # the same logic in JavaScript (needs Node.js 18 or newer)
```

## Project structure

| File | Purpose |
| --- | --- |
| `gates.py` | Logic gates and universal-gate constructions |
| `cmos.py` | Transistor-level CMOS NOT, NAND and AND |
| `truth_table.py` | Truth tables and the safe expression parser |
| `main.py` | Command-line interface, including `web` |
| `test_simulator.py` | Python unit tests |
| `index.html`, `style.css`, `app.js` | The web page |
| `logic.js` | The same gates, parser and CMOS model in JavaScript |
| `logic.test.js` | JavaScript tests |

## Ideas for next steps

- Add a half adder, full adder and ripple-carry adder built from these gates.
- Build a 4-bit ALU and show it on the web page.
- Add CMOS NOR and AND circuits to the page.

## License

MIT. See [LICENSE](LICENSE).
