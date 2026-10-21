# Logic Gate Simulator

A small Python tool that simulates digital logic from the gate level down to the transistor level. It was built while studying Computer Architecture (gates and transistors), and it has no dependencies beyond the Python standard library.

## Features

- **Basic and derived gates:** NOT, AND, OR, NAND, NOR, XOR, XNOR and BUFFER, with multi-input AND/OR.
- **Truth tables** for any gate or any custom Boolean expression.
- **Universal gates:** builds NOT, AND and OR from only NAND, and from only NOR, and checks them against the real gates.
- **CMOS simulation:** models nMOS and pMOS transistors as switches and builds NOT, NAND and AND, including the ON/OFF state of every transistor (pMOS in parallel and nMOS in series for NAND).
- **Safe expression parser:** custom expressions are parsed with Python's `ast` module and restricted to Boolean operators, so no arbitrary code runs.

## Requirements

Python 3.8 or newer.

## Usage

```bash
python main.py list
python main.py gate xor
python main.py expr "(not X and Y) or (X and not Y)"
python main.py universal
python main.py cmos
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

## Running the tests

```bash
python -m unittest -v
```

## Project structure

| File | Purpose |
| --- | --- |
| `gates.py` | Logic gates and universal-gate constructions |
| `cmos.py` | Transistor-level CMOS NOT, NAND and AND |
| `truth_table.py` | Truth tables and the safe expression parser |
| `main.py` | Command-line interface |
| `test_simulator.py` | Unit tests |

## Ideas for next steps

- Add a half adder, full adder and ripple-carry adder built from these gates.
- Build a 4-bit ALU.
- Add a simple web or Tkinter interface to toggle inputs visually.

## License

MIT. See [LICENSE](LICENSE).
