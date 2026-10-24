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

  it("skips scanned documents such as PDF and DjVu pages", () => {
    const scans = {
      query: {
        pages: {
          "1": { index: 1, imageinfo: [{ url: "https://upload.example/book.pdf", thumburl: "https://upload.example/book.pdf/page1.jpg" }] },
          "2": { index: 2, imageinfo: [{ url: "https://upload.example/old.djvu", thumburl: "https://upload.example/old.djvu/page1.jpg" }] },
          "3": { index: 3, imageinfo: [{ url: "https://upload.example/real.jpg", thumburl: "https://upload.example/real-800.jpg" }] },
        },
      },
    };
    expect(pickCommonsImage(scans)?.url).toBe("https://upload.example/real-800.jpg");
  });

  it("returns null when there are no results", () => {
    expect(pickCommonsImage({})).toBeNull();
  });
});
