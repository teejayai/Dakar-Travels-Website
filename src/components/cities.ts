export type City = {
  name: string;
  src: string;
};

// Order mirrors the Figma landmark strip (left → right).
export const CITIES: City[] = [
  { name: "Dehradun", src: "/landmarks/dehradun.svg" },
  { name: "Kochi", src: "/landmarks/kochi.svg" },
  { name: "Delhi", src: "/landmarks/delhi.svg" },
  { name: "Mangalore", src: "/landmarks/mangalore.svg" },
  { name: "Chennai", src: "/landmarks/chennai.svg" },
  { name: "Mumbai", src: "/landmarks/mumbai.svg" },
  { name: "Hyderabad", src: "/landmarks/hyderabad.svg" },
  { name: "Coimbatore", src: "/landmarks/coimbatore.svg" },
];
