import pCard1 from "@/assets/p-card-1.jpg";
import pCard2 from "@/assets/p-card-2.jpg";
import qalCard from "@/assets/qal-card.jpg.asset.json";
import halo1 from "@/assets/halo-1.jpg.asset.json";
import halo2 from "@/assets/halo-2.jpg.asset.json";
import halo3 from "@/assets/halo-3.jpg.asset.json";
import cardCowParsley from "@/assets/card-cow-parsley.jpg";

export type Flower = {
  slug: string;
  no: string;
  name: string;
  latin: string;
  note: string;
  product: string;
  edition: string;
  price: number;
  weightKg: number;
  represents: string;
  why: string;
  story: string;
  card: string;
  images: { src: string; alt: string }[];
};

export const flowers: Flower[] = [
  {
    slug: "queen-annes-lace",
    no: "041",
    name: "Queen Anne's Lace",
    latin: "Daucus carota",
    note: "Discovered, never announced.",
    product: "Object No.01 — Halo Pendant",
    edition: "Edition 001 / 101",
    price: 420,
    weightKg: 2.4,
    represents:
      "A hanging plywood pendant, its slatted drum ring cut from fine vertical ribs and closed with a soft diffuser disc that glows like an open umbel.",
    why: "The flower opens as a wide, weightless dome held on the thinnest of stems — the exact silhouette we were chasing. Its umbel diffuses light the way our shade does: softly, from the edges inward.",
    story:
      "No.01 began as a failed bowl. A sheet of ply cracked in the press, curved the wrong way, and sat on the bench for a month before someone turned it over and put a bulb underneath. We kept the curve, lost the crack, and learned to cut a hundred ribs that meet without a single splinter. Each pendant is assembled one at a time and takes four days to leave the jig.",
    card: qalCard.url,
    images: [
      { src: halo1.url, alt: "Detail of the slatted plywood ribs and diffuser of the Halo Pendant" },
      { src: halo2.url, alt: "Halo Pendant hanging above a dark table with ceramic vessels" },
      { src: halo3.url, alt: "Halo Pendant edition plate — Object 001, Edition 001 / 101" },
    ],
  },
  {
    slug: "cow-parsley",
    no: "042",
    name: "Cow Parsley",
    latin: "Anthriscus sylvestris",
    note: "Roadside architecture.",
    product: "Object No.12 — Card Holder",
    edition: "Edition 042 / 200",
    price: 60,
    weightKg: 0.4,
    represents:
      "A small desk card holder milled from a single block of laminated plywood, with a shallow scoop cut for the thumb.",
    why: "Cow parsley builds whole structures out of almost nothing — hollow stems, thin ribs, perfect balance. Our holder is the same idea: a few grams of material doing all the work of holding something upright.",
    story:
      "We designed this for the botanical archive card that ships with every object, because customers kept telling us they had nowhere to put it. It began as an offcut exercise — the block is cut from the waste left by the dome lamps, so nothing from a sheet leaves the workshop unused.",
    card: cardCowParsley,
    images: [
      { src: pCard1, alt: "Plywood card holder with a stack of cards" },
      { src: pCard2, alt: "Card holder photographed from above with a botanical card" },
    ],
  },
];

export function getFlower(slug: string) {
  return flowers.find((f) => f.slug === slug);
}
