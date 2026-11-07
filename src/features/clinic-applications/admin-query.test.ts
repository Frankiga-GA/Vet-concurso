import { describe, expect, it } from "vitest";
import { adminApplicationsHref, parseAdminQuery } from "./admin-query";

describe("admin application filters and pagination", () => {
  it("opens the submitted queue by default", () => {
    expect(parseAdminQuery({})).toEqual({ filter: "submitted", page: 1, from: 0, to: 20 });
  });

  it("preserves valid filters and uses inclusive ranges with one extra row", () => {
    expect(parseAdminQuery({ status: "needs_information", page: "3" }))
      .toEqual({ filter: "needs_information", page: 3, from: 40, to: 60 });
    expect(adminApplicationsHref("needs_information", 3)).toBe("/admin/clinic-applications?status=needs_information&page=3");
    expect(adminApplicationsHref("all")).toBe("/admin/clinic-applications?status=all");
  });

  it.each(["0", "-1", "1.5", "10001", "1e3", ["2", "3"]])("normalizes an invalid page (%j)", (page) => {
    expect(parseAdminQuery({ status: ["approved", "rejected"], page })).toEqual(parseAdminQuery({}));
  });
});
