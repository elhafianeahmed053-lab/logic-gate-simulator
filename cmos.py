"""Transistor-level CMOS simulation (NOT, NAND, AND).

Models the lecture's switch view of MOS transistors:
  * nMOS is ON when its gate is high (1), OFF when low (0).
  * pMOS is ON when its gate is low (0), OFF when high (1).
A CMOS gate has a pull-up network of pMOS to 3 V and a pull-down network of
nMOS to 0 V. Exactly one network should conduct for any input.
"""

VDD_VOLTS = 3.0  # the lecture uses 3 V for logic 1 and 0 V for logic 0


def nmos_on(gate):
    return gate == 1


def pmos_on(gate):
    return gate == 0


def cmos_not(a):
    """One pMOS (pull-up) and one nMOS (pull-down).

    Returns (output, states) where states maps transistor name to ON/OFF.
    """
    p, n = pmos_on(a), nmos_on(a)
    out = _resolve(pull_up=p, pull_down=n)
    return out, {"P": p, "N": n}


def cmos_nand(a, b):
    """P1 || P2 in parallel (pull-up); N1 -- N2 in series (pull-down)."""
    p1, p2 = pmos_on(a), pmos_on(b)
    n1, n2 = nmos_on(a), nmos_on(b)
    pull_up = p1 or p2          # parallel: either one pulls the output up
    pull_down = n1 and n2       # series: both must be ON to pull it down
    out = _resolve(pull_up, pull_down)
    return out, {"P1": p1, "P2": p2, "N1": n1, "N2": n2}


def cmos_and(a, b):
    """AND = NAND followed by NOT (adds the extra P3/N3 pair)."""
    nand_out, _ = cmos_nand(a, b)
    out, _ = cmos_not(nand_out)
    return out


def _resolve(pull_up, pull_down):
    if pull_up and not pull_down:
        return 1
    if pull_down and not pull_up:
        return 0
    raise RuntimeError(
        "invalid CMOS state: "
        + ("short circuit (both networks ON)" if pull_up else "floating output")
    )


def _onoff(state):
    return "ON " if state else "OFF"


def print_not_table():
    print("CMOS NOT gate")
    print("A | P   N   | Y")
    print("--+---------+--")
    for a in (0, 1):
        y, s = cmos_not(a)
        print(f"{a} | {_onoff(s['P'])} {_onoff(s['N'])} | {y}")


def print_nand_table():
    print("CMOS NAND gate")
    print("A B | P1  P2  N1  N2  | Y")
    print("----+-----------------+--")
    for a in (0, 1):
        for b in (0, 1):
            y, s = cmos_nand(a, b)
            print(
                f"{a} {b} | {_onoff(s['P1'])} {_onoff(s['P2'])} "
                f"{_onoff(s['N1'])} {_onoff(s['N2'])} | {y}"
            )
