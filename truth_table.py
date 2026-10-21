"""Truth tables for named gates and for custom Boolean expressions.

Expressions use Python-style operators. The syntax tree is checked against an
allow-list before evaluation, so only these are accepted:  and  or  not  ^ (XOR)  ( )  0  1  and
single-letter or word variable names.

Example:  "(not X and Y) or (X and not Y)"
"""

import ast
import itertools

_ALLOWED = (
    ast.Expression, ast.BoolOp, ast.And, ast.Or, ast.UnaryOp, ast.Not,
    ast.BinOp, ast.BitXor, ast.Name, ast.Load, ast.Constant,
)


def _variables(tree):
    return sorted({n.id for n in ast.walk(tree) if isinstance(n, ast.Name)})


def parse(expression):
    """Parse an expression safely; return (compiled_code, variable_names)."""
    tree = ast.parse(expression, mode="eval")
    for node in ast.walk(tree):
        if not isinstance(node, _ALLOWED):
            raise ValueError(f"unsupported syntax: {type(node).__name__}")
        if isinstance(node, ast.Constant) and node.value not in (0, 1):
            raise ValueError("constants must be 0 or 1")
    return compile(tree, "<expr>", "eval"), _variables(tree)


def expression_table(expression):
    """Return (variable_names, rows) where each row is (inputs, output)."""
    code, names = parse(expression)
    if not names:
        raise ValueError("expression has no variables")
    rows = []
    for values in itertools.product((0, 1), repeat=len(names)):
        env = dict(zip(names, values))
        result = int(bool(eval(code, {"__builtins__": {}}, env)))  # noqa: S307
        rows.append((values, result))
    return names, rows


def gate_table(gate, arity, names=None):
    """Truth table for a gate function taking `arity` bits."""
    names = names or ["A", "B", "C", "D"][:arity]
    rows = [
        (values, gate(*values))
        for values in itertools.product((0, 1), repeat=arity)
    ]
    return names, rows


def format_table(names, rows, output_name="Out"):
    header = " ".join(names) + f" | {output_name}"
    lines = [header, "-" * len(header)]
    for values, out in rows:
        lines.append(" ".join(str(v) for v in values) + f" | {out}")
    return "\n".join(lines)
