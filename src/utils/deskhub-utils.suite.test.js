import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import debounceDefault, {
  debounce,
} from "./debounce.js";

import {
  formatDate,
  formatDateTime,
  formatRelative,
} from "./formatDate.js";

import {
  clear,
  clearStorage,
  get,
  getItem,
  remove,
  removeItem,
  set,
  setItem,
} from "./storage.js";

describe(
  "Deskhub utils suite",
  () => {
    describe(
      "formatDate",
      () => {
        it(
          "returns dash for falsy values",
          () => {
            expect(
              formatDate(null)
            ).toBe("-");

            expect(
              formatDate(undefined)
            ).toBe("-");

            expect(
              formatDate("")
            ).toBe("-");
          }
        );

        it(
          "formats a known ISO date with en-IN parts",
          () => {
            const out =
              formatDate(
                "2026-03-05T00:00:00.000Z"
              );

            expect(out).toContain(
              "2026"
            );

            expect(out).toMatch(
              /\d{2}/
            );
          }
        );
      }
    );

    describe(
      "formatDateTime",
      () => {
        it(
          "returns dash for falsy values",
          () => {
            expect(
              formatDateTime(
                null
              )
            ).toBe("-");
          }
        );

        it(
          "includes time fields for a timestamp",
          () => {
            const out =
              formatDateTime(
                "2026-01-02T15:30:00.000Z"
              );

            expect(out).toContain(
              "2026"
            );

            expect(out).toMatch(
              /\d{1,2}/u
            );
          }
        );
      }
    );

    describe(
      "formatRelative",
      () => {
        beforeEach(() => {
          vi.useFakeTimers();

          vi.setSystemTime(
            new Date(
              "2026-06-15T12:00:00.000Z"
            )
          );
        });

        afterEach(() => {
          vi.useRealTimers();
        });

        it(
          "returns dash for falsy values",
          () => {
            expect(
              formatRelative(
                ""
              )
            ).toBe("-");
          }
        );

        it(
          "uses year bucket for large differences",
          () => {
            const out =
              formatRelative(
                "2024-06-15T12:00:00.000Z"
              );

            expect(out).not.toBe(
              "-"
            );

            expect(out).toMatch(
              /year|yr/i
            );
          }
        );

        it(
          "uses month bucket when below a year but large enough",
          () => {
            const out =
              formatRelative(
                "2026-04-15T12:00:00.000Z"
              );

            expect(out).toMatch(
              /month|mo/i
            );
          }
        );

        it(
          "uses day bucket",
          () => {
            const out =
              formatRelative(
                "2026-06-10T12:00:00.000Z"
              );

            expect(out).toMatch(
              /day/i
            );
          }
        );

        it(
          "uses hour bucket",
          () => {
            const out =
              formatRelative(
                "2026-06-15T08:00:00.000Z"
              );

            expect(out).toMatch(
              /hour|hr/i
            );
          }
        );

        it(
          "uses minute bucket",
          () => {
            const out =
              formatRelative(
                "2026-06-15T11:30:00.000Z"
              );

            expect(out).toMatch(
              /minute|min/i
            );
          }
        );

        it(
          'returns "just now" for sub-minute deltas',
          () => {
            const out =
              formatRelative(
                "2026-06-15T12:00:20.000Z"
              );

            expect(out).toBe(
              "just now"
            );
          }
        );

        it(
          "handles future dates",
          () => {
            const out =
              formatRelative(
                "2027-06-15T12:00:00.000Z"
              );

            expect(out).toMatch(
              /year|yr/i
            );
          }
        );
      }
    );

    describe(
      "debounce",
      () => {
        beforeEach(() => {
          vi.useFakeTimers();
        });

        afterEach(() => {
          vi.useRealTimers();
        });

        it(
          "invokes callback after delay with latest args",
          () => {
            const fn =
              vi.fn();

            const d =
              debounce(
                fn,
                100
              );

            d(1);
            d(2);
            d(3);

            expect(
              fn
            ).not.toHaveBeenCalled();

            vi.advanceTimersByTime(
              99
            );

            expect(
              fn
            ).not.toHaveBeenCalled();

            vi.advanceTimersByTime(
              1
            );

            expect(
              fn
            ).toHaveBeenCalledTimes(
              1
            );

            expect(
              fn
            ).toHaveBeenCalledWith(
              3
            );
          }
        );

        it(
          "uses default delay of 300ms",
          () => {
            const fn =
              vi.fn();

            const d =
              debounce(fn);

            d();

            vi.advanceTimersByTime(
              299
            );

            expect(
              fn
            ).not.toHaveBeenCalled();

            vi.advanceTimersByTime(
              1
            );

            expect(
              fn
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        it(
          "cancel prevents pending invocation",
          () => {
            const fn =
              vi.fn();

            const d =
              debounce(
                fn,
                50
              );

            d();
            d.cancel();

            vi.advanceTimersByTime(
              200
            );

            expect(
              fn
            ).not.toHaveBeenCalled();
          }
        );

        it(
          "default export matches named debounce",
          () => {
            expect(
              debounceDefault
            ).toBe(debounce);
          }
        );
      }
    );

    describe(
      "storage",
      () => {
        beforeEach(() => {
          localStorage.clear();
        });

        afterEach(() => {
          localStorage.clear();
        });

        it(
          "set and get round-trip objects",
          () => {
            const payload =
              {
                a: 1,
                b: "x",
              };

            set(
              "user",
              payload
            );

            expect(
              get("user")
            ).toEqual(
              payload
            );

            setItem(
              "token",
              "abc"
            );

            expect(
              getItem("token")
            ).toBe(
              "abc"
            );
          }
        );

        it(
          "get returns null for missing keys",
          () => {
            expect(
              get("missing")
            ).toBe(
              null
            );
          }
        );

        it(
          "get returns raw string when JSON.parse fails",
          () => {
            localStorage.setItem(
              "deskhub_bad",
              "not-json{"
            );

            expect(
              get("bad")
            ).toBe(
              "not-json{"
            );
          }
        );

        it(
          "remove deletes a prefixed key",
          () => {
            set(
              "tmp",
              1
            );

            remove("tmp");

            expect(
              get("tmp")
            ).toBe(
              null
            );

            set(
              "x",
              1
            );

            removeItem("x");

            expect(
              get("x")
            ).toBe(
              null
            );
          }
        );

        it(
          "clear removes only deskhub_ prefixed keys",
          () => {
            localStorage.setItem(
              "other_app",
              "1"
            );

            set(
              "a",
              1
            );

            set(
              "b",
              2
            );

            clear();

            expect(
              get("a")
            ).toBe(
              null
            );

            expect(
              get("b")
            ).toBe(
              null
            );

            expect(
              localStorage.getItem(
                "other_app"
              )
            ).toBe(
              "1"
            );

            localStorage.setItem(
              "other_app",
              "1"
            );

            set(
              "c",
              3
            );

            clearStorage();

            expect(
              get("c")
            ).toBe(
              null
            );

            expect(
              localStorage.getItem(
                "other_app"
              )
            ).toBe(
              "1"
            );
          }
        );
      }
    );
  }
);
