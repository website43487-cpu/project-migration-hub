import { describe, expect, it } from "vitest";
import { collectMedia, personalObjectPath, replacedMediaPaths } from "@/lib/media-policy";

const origin = "https://owner.example.com";
const old = `${origin}/storage/v1/object/public/media/old.jpg`;
const next = `${origin}/storage/v1/object/public/media/new.jpg`;

describe("Media storage rules", () => {
  it("deletes replaced files after they stop being referenced", () => {
    expect(replacedMediaPaths({ src: old }, { src: next }, [{ src: next }], origin)).toEqual(["old.jpg"]);
  });
  it("keeps a replaced file used by another page", () => {
    expect(replacedMediaPaths(old, next, { otherPage: old }, origin)).toEqual([]);
  });
  it("never deletes originals from other storage", () => {
    expect(replacedMediaPaths("https://other.example.com/storage/v1/object/public/media/old.jpg", next, [], origin)).toEqual([]);
  });
  it("does not mistake another project's media for personal storage", () => {
    expect(personalObjectPath("https://other.example.com/storage/v1/object/public/media/photo.jpg", origin)).toBeNull();
  });
  it("discovers bundled videos, logos and nested product images", () => {
    expect([...collectMedia(["/assets/film.mp4", { src: "/__l5e/assets-v1/logo/brand.svg" }, { images: [{ src: next }] }])]).toEqual(["/assets/film.mp4", "/__l5e/assets-v1/logo/brand.svg", next]);
  });
});