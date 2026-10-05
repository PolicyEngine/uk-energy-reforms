import { describe, expect, test } from "bun:test";
import { formatRoundedThousands } from "./formatters";

describe("formatRoundedThousands", () => {
  test("keeps two significant figures", () => {
    expect(formatRoundedThousands(142.3)).toBe("140k");
    expect(formatRoundedThousands(11.2)).toBe("11k");
    expect(formatRoundedThousands(285)).toBe("290k");
    expect(formatRoundedThousands(4.64)).toBe("4.6k");
    expect(formatRoundedThousands(1_250)).toBe("1,300k");
  });

  test("shows the size of a fall without its sign", () => {
    expect(formatRoundedThousands(-73.4)).toBe("73k");
    expect(formatRoundedThousands(0)).toBe("0k");
  });
});
