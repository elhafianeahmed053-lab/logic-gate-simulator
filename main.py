"""Command-line interface for the logic gate simulator.

Usage:
    python main.py list
    python main.py gate xor
    python main.py expr "(not X and Y) or (X and not Y)"
    python main.py universal
    python main.py cmos
"""

import argparse
import sys

import cmos
import gates
import truth_table as tt


def cmd_list(_args):
    print("Available gates:", ", ".join(sorted(gates.GATES)))


def cmd_gate(args):
    name = args.name.lower()
    if name not in gates.GATES:
        sys.exit(f"Unknown gate '{args.name}'. Try: python main.py list")
    fn, arity = gates.GATES[name]
    names, rows = tt.gate_table(fn, arity)
    print(f"{name.upper()} gate")
    print(tt.format_table(names, rows, output_name=name.upper()))


def cmd_expr(args):
    try:
        names, rows = tt.expression_table(args.expression)
    except (ValueError, SyntaxError) as exc:
        sys.exit(f"Invalid expression: {exc}")
    print(f"F = {args.expression}")
    print(tt.format_table(names, rows, output_name="F"))


def cmd_universal(_args):
    checks = {
        "NOT from NAND": (gates.not_from_nand, gates.NOT, 1),
        "AND from NAND": (gates.and_from_nand, gates.AND, 2),
        "OR from NAND": (gates.or_from_nand, gates.OR, 2),
        "NOT from NOR": (gates.not_from_nor, gates.NOT, 1),
        "OR from NOR": (gates.or_from_nor, gates.OR, 2),
        "AND from NOR": (gates.and_from_nor, gates.AND, 2),
    }
    for label, (built, reference, arity) in checks.items():
        _, rows = tt.gate_table(built, arity)
        _, expected = tt.gate_table(reference, arity)
        ok = rows == expected
        print(f"{label}: {'matches' if ok else 'DOES NOT match'}")


def cmd_cmos(_args):
    cmos.print_not_table()
    print()
    cmos.print_nand_table()


def build_parser():
    parser = argparse.ArgumentParser(description="Logic gate simulator")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list", help="list available gates").set_defaults(func=cmd_list)

    p = sub.add_parser("gate", help="print the truth table of a gate")
    p.add_argument("name")
    p.set_defaults(func=cmd_gate)

    p = sub.add_parser("expr", help="truth table of a Boolean expression")
    p.add_argument("expression")
    p.set_defaults(func=cmd_expr)

    sub.add_parser(
        "universal", help="prove NAND and NOR are universal"
    ).set_defaults(func=cmd_universal)

    sub.add_parser(
        "cmos", help="transistor-level CMOS NOT and NAND tables"
    ).set_defaults(func=cmd_cmos)
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
