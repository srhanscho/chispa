import { describe, expect, it } from "vitest";
import { pickCommonsImage } from "./commons";

const response = {
  query: {
    pages: {
      "22": {
        index: 2,
        imageinfo: [{ thumburl: "https://upload.example/second.jpg", extmetadata: {} }],
      },
      "11": {
        index: 1,
        imageinfo: [
          {
            thumburl: "https://upload.example/first.jpg",
            descriptionurl: "https://commons.wikimedia.org/wiki/File:First.jpg",
            extmetadata: {
              Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:Ana">Ana Pérez</a>' },
              LicenseShortName: { value: "CC BY-SA 4.0" },
            },
          },
        ],
      },
    },
  },
};

describe("pickCommonsImage", () => {
  it("picks the best-ranked result and cleans the author credit", () => {
    expect(pickCommonsImage(response)).toEqual({
      url: "https://upload.example/first.jpg",
      source: "wikimedia",
      credit: "Ana Pérez · CC BY-SA 4.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:First.jpg",
    });
  });

  it("returns null when there are no results", () => {
    expect(pickCommonsImage({})).toBeNull();
  });
});
