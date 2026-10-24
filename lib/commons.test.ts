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

  it("only accepts files whose name contains the subject", () => {
    const results = {
      query: {
        pages: {
          "1": { index: 1, title: "File:White stork Ciconia boyciana.jpg", imageinfo: [{ thumburl: "https://upload.example/stork.jpg" }] },
          "2": { index: 2, title: "File:Dinosaur park Brontosaurus.jpg", imageinfo: [{ thumburl: "https://upload.example/dino.jpg" }] },
        },
      },
    };
    expect(pickCommonsImage(results, "dinos")?.url).toBe("https://upload.example/dino.jpg");
    expect(pickCommonsImage(results, "volca")).toBeNull();
  });

  it("skips old book scans from the Internet Archive", () => {
    const results = {
      query: {
        pages: {
          "1": { index: 1, title: "File:Dinosaur hunting in western Canada (1966) (20956310185).jpg", imageinfo: [{ thumburl: "https://upload.example/scan.jpg" }] },
          "2": { index: 2, title: "File:Hawaii and its volcanoes (IA hawaiiitsvolcano00hitcrich).pdf", imageinfo: [{ thumburl: "https://upload.example/ia.jpg" }] },
          "3": { index: 3, title: "File:Dinosaur skeleton.jpg", imageinfo: [{ thumburl: "https://upload.example/dino.jpg" }] },
        },
      },
    };
    expect(pickCommonsImage(results, "dinos")?.url).toBe("https://upload.example/dino.jpg");
  });

  it("returns null when there are no results", () => {
    expect(pickCommonsImage({})).toBeNull();
  });
});
