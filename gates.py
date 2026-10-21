"""Basic and derived logic gates, plus universal-gate constructions.

Every gate takes bits (0 or 1) and returns a bit, mirroring the lecture:
one binary output, one or more binary inputs.
"""


def _check(*bits):
    for b in bits:
        if b not in (0, 1):
            raise ValueError(f"inputs must be 0 or 1, got {b!r}")


# --- Basic gates -----------------------------------------------------------

def NOT(a):
    """Complement of the input: X = A'."""
    _check(a)
    return 1 - a


def AND(*inputs):
    """1 only if all inputs are 1: X = A . B"""
    _check(*inputs)
    return int(all(inputs))


def OR(*inputs):
    """1 if any input is 1: X = A + B"""
    _check(*inputs)
    return int(any(inputs))


# --- Derived gates ---------------------------------------------------------

def NAND(*inputs):
    """AND followed by NOT: X = (A . B)'"""
    return NOT(AND(*inputs))


def NOR(*inputs):
    """OR followed by NOT: X = (A + B)'"""
    return NOT(OR(*inputs))


def XOR(a, b):
    """1 only if the inputs differ: F = X'.Y + X.Y' (built from NOT, AND, OR)."""
    return OR(AND(NOT(a), b), AND(a, NOT(b)))


def XNOR(a, b):
    """XOR followed by NOT: 1 only if the inputs are the same."""
    return NOT(XOR(a, b))


def BUFFER(a):
    """Output equals input; used to isolate circuits and drive heavy loads."""
    _check(a)
    return a


# --- Universal gates -------------------------------------------------------
# NAND and NOR are universal: each can build AND, OR and NOT on its own.

def not_from_nand(a):
    return NAND(a, a)


def and_from_nand(a, b):
    return not_from_nand(NAND(a, b))


def or_from_nand(a, b):
    return NAND(not_from_nand(a), not_from_nand(b))


def not_from_nor(a):
    return NOR(a, a)


def or_from_nor(a, b):
    return not_from_nor(NOR(a, b))


def and_from_nor(a, b):
    return NOR(not_from_nor(a), not_from_nor(b))


GATES = {
    "not": (NOT, 1),
    "and": (AND, 2),
    "or": (OR, 2),
    "nand": (NAND, 2),
    "nor": (NOR, 2),
    "xor": (XOR, 2),
    "xnor": (XNOR, 2),
    "buffer": (BUFFER, 1),
}
