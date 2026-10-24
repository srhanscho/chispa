import { describe, expect, it } from "vitest";
import { pickCommonsImage, pickCommonsImages } from "./commons";

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

  it("keeps regular Flickr photos that only carry a photo id", () => {
    const results = {
      query: {
        pages: {
          "1": { index: 1, title: "File:Monarch butterfly chrysalis (53138332352).jpg", imageinfo: [{ thumburl: "https://upload.example/chrysalis.jpg" }] },
        },
      },
    };
    expect(pickCommonsImage(results, "butte")?.url).toBe("https://upload.example/chrysalis.jpg");
  });

  it("returns null when there are no results", () => {
    expect(pickCommonsImage({})).toBeNull();
  });
});

describe("pickCommonsImages", () => {
  it("returns up to the limit of matching candidates in search order", () => {
    const pages = Object.fromEntries(
      [1, 2, 3, 4, 5].map((i) => [
        String(i),
        { index: i, title: `File:Volcano ${i}.jpg`, imageinfo: [{ thumburl: `https://upload.example/${i}.jpg` }] },
      ]),
    );
    const urls = pickCommonsImages({ query: { pages } }, "volca", 3).map((c) => c.url);
    expect(urls).toEqual(["https://upload.example/1.jpg", "https://upload.example/2.jpg", "https://upload.example/3.jpg"]);
  });
});
