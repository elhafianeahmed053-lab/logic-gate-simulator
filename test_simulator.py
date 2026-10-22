import itertools
import pathlib
import unittest

import cmos
import gates
import truth_table as tt


class TestBasicGates(unittest.TestCase):
    def test_and(self):
        self.assertEqual([gates.AND(a, b) for a, b in itertools.product((0, 1), repeat=2)], [0, 0, 0, 1])

    def test_or(self):
        self.assertEqual([gates.OR(a, b) for a, b in itertools.product((0, 1), repeat=2)], [0, 1, 1, 1])

    def test_not(self):
        self.assertEqual([gates.NOT(0), gates.NOT(1)], [1, 0])

    def test_multi_input(self):
        self.assertEqual(gates.AND(1, 1, 1), 1)
        self.assertEqual(gates.AND(1, 0, 1), 0)
        self.assertEqual(gates.OR(0, 0, 1), 1)

    def test_invalid_input(self):
        with self.assertRaises(ValueError):
            gates.AND(2, 1)


class TestDerivedGates(unittest.TestCase):
    def outputs(self, gate):
        return [gate(a, b) for a, b in itertools.product((0, 1), repeat=2)]

    def test_nand(self):
        self.assertEqual(self.outputs(gates.NAND), [1, 1, 1, 0])

    def test_nor(self):
        self.assertEqual(self.outputs(gates.NOR), [1, 0, 0, 0])

    def test_xor(self):
        self.assertEqual(self.outputs(gates.XOR), [0, 1, 1, 0])

    def test_xnor(self):
        self.assertEqual(self.outputs(gates.XNOR), [1, 0, 0, 1])

    def test_buffer(self):
        self.assertEqual([gates.BUFFER(0), gates.BUFFER(1)], [0, 1])


class TestUniversalGates(unittest.TestCase):
    pairs = list(itertools.product((0, 1), repeat=2))

    def test_from_nand(self):
        self.assertEqual([gates.not_from_nand(a) for a in (0, 1)], [1, 0])
        for a, b in self.pairs:
            self.assertEqual(gates.and_from_nand(a, b), gates.AND(a, b))
            self.assertEqual(gates.or_from_nand(a, b), gates.OR(a, b))

    def test_from_nor(self):
        self.assertEqual([gates.not_from_nor(a) for a in (0, 1)], [1, 0])
        for a, b in self.pairs:
            self.assertEqual(gates.and_from_nor(a, b), gates.AND(a, b))
            self.assertEqual(gates.or_from_nor(a, b), gates.OR(a, b))


class TestCMOS(unittest.TestCase):
    def test_not_matches_logic(self):
        for a in (0, 1):
            self.assertEqual(cmos.cmos_not(a)[0], gates.NOT(a))

    def test_nand_matches_logic(self):
        for a, b in itertools.product((0, 1), repeat=2):
            self.assertEqual(cmos.cmos_nand(a, b)[0], gates.NAND(a, b))

    def test_and_matches_logic(self):
        for a, b in itertools.product((0, 1), repeat=2):
            self.assertEqual(cmos.cmos_and(a, b), gates.AND(a, b))

    def test_nand_transistor_states_for_00(self):
        _, s = cmos.cmos_nand(0, 0)
        self.assertEqual(s, {"P1": True, "P2": True, "N1": False, "N2": False})

    def test_nand_transistor_states_for_11(self):
        _, s = cmos.cmos_nand(1, 1)
        self.assertEqual(s, {"P1": False, "P2": False, "N1": True, "N2": True})


class TestExpressions(unittest.TestCase):
    def test_xor_expression(self):
        names, rows = tt.expression_table("(not X and Y) or (X and not Y)")
        self.assertEqual(names, ["X", "Y"])
        self.assertEqual([out for _, out in rows], [0, 1, 1, 0])

    def test_caret_is_xor(self):
        _, rows = tt.expression_table("A ^ B")
        self.assertEqual([out for _, out in rows], [0, 1, 1, 0])

    def test_rejects_unsafe_code(self):
        with self.assertRaises(ValueError):
            tt.expression_table("__import__('os').system('echo hi')")

    def test_rejects_bad_constant(self):
        with self.assertRaises(ValueError):
            tt.expression_table("A and 5")


class TestWebPage(unittest.TestCase):
    """The web page ships in the same repo, so keep its files wired together."""

    root = pathlib.Path(__file__).resolve().parent

    def test_page_files_exist(self):
        for name in ("index.html", "style.css", "logic.js", "app.js"):
            self.assertTrue((self.root / name).exists(), name)

    def test_index_references_existing_files(self):
        html = (self.root / "index.html").read_text(encoding="utf-8")
        for name in ("style.css", "logic.js", "app.js"):
            self.assertIn(name, html)

    def test_web_command_is_registered(self):
        import main
        args = main.build_parser().parse_args(["web", "--port", "8123", "--no-browser"])
        self.assertEqual((args.command, args.port, args.no_browser), ("web", 8123, True))


if __name__ == "__main__":
    unittest.main()
