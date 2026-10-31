import { describe, expect, it } from "vitest";
import { collectMedia, personalObjectPath, planReplacementCleanup, replacedMediaPaths } from "@/lib/media-policy";

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
describe("Replacement cleanup waits for verified copies", () => {
  const base = { before: { src: old }, after: { src: next }, references: [{ src: next }], origin };
  it("deletes the old file once the replacement is verified in personal storage", () => {
    expect(planReplacementCleanup({ ...base, verifiedPaths: new Set(["new.jpg"]) })).toEqual({ remove: ["old.jpg"], blocked: [] });
  });
  it("keeps the old file when the replacement is not confirmed in personal storage", () => {
    expect(planReplacementCleanup({ ...base, verifiedPaths: new Set() })).toEqual({ remove: [], blocked: [next] });
  });
  it("keeps the old file when the replacement lives outside personal storage", () => {
    const outside = "https://cdn.example.net/new.jpg";
    expect(planReplacementCleanup({ ...base, after: { src: outside }, references: [], verifiedPaths: new Set() }).remove).toEqual([]);
  });
  it("never deletes branding originals", () => {
    const logo = `${origin}/storage/v1/object/public/media/branding/logo.png`;
    expect(planReplacementCleanup({ ...base, before: { src: logo }, verifiedPaths: new Set(["new.jpg"]) }).remove).toEqual([]);
  });
});
