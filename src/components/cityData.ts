export type CityInfo = {
  slug: string;
  name: string;
  src: string;
  state: string;
  population: string;
  nickname: string;
  language: string;
  climate: string;
  description: string;
  landmark: string;
  /* Motion view — a Vercel Blob URL (store: dakar-videos). Upload with
       vercel blob put <file> --pathname videos/<slug>.mp4 --access public \
         --rw-token "$BLOB_READ_WRITE_TOKEN"
     and paste the returned URL here. Cities without one fall back to the
     mock frame. */
  video?: string;
};

// Facts verified online (metro population estimates, 2025).
export const CITY_INFO: CityInfo[] = [
  {
    slug: "dehradun",
    name: "Dehradun",
    src: "/landmarks/dehradun.svg",
    state: "Uttarakhand, India",
    population: "1.0 Million",
    nickname: "School Capital of India",
    language: "Hindi",
    climate: "Mild, humid subtropical",
    description:
      "Dehradun is the capital of Uttarakhand and one of North India's most livable cities, cradled in the scenic Doon Valley between the Himalayas and the Shivalik hills. Often called the 'School Capital of India' for its prestigious institutions like The Doon School and the Indian Military Academy, the city blends colonial-era charm with a growing modern economy. With Mussoorie and Rishikesh just a short drive away, Dehradun offers crisp mountain air, forested surroundings, and a relaxed pace that makes it a natural gateway to the Himalayas.",
    landmark: "Clock Tower (Ghanta Ghar)",
  },
  {
    slug: "kochi",
    name: "Kochi",
    src: "/landmarks/kochi.svg",
    state: "Kerala, India",
    population: "3.6 Million",
    nickname: "Queen of the Arabian Sea",
    language: "Malayalam",
    climate: "Tropical monsoon",
    description:
      "Kochi is Kerala's commercial capital and one of India's most cosmopolitan port cities, shaped by centuries of trade with Arab, Chinese, Portuguese, Dutch, and British merchants. Known as the 'Queen of the Arabian Sea,' the city pairs the old-world charm of Fort Kochi — with its iconic Chinese fishing nets, colonial streets, and art cafes — with a fast-growing modern metro, IT parks, and a busy harbor. Surrounded by backwaters and lagoons, Kochi is a place where maritime history, contemporary art, and Kerala's laid-back coastal culture flow together effortlessly.",
    landmark: "Chinese Fishing Nets, Fort Kochi",
  },
  {
    slug: "delhi",
    name: "Delhi",
    src: "/landmarks/delhi.svg",
    state: "Delhi (NCT), India",
    population: "34.7 Million",
    nickname: "Heart of India",
    language: "Hindi",
    climate: "Hot semi-arid",
    description:
      "Delhi is India's capital and one of the largest urban agglomerations on earth, a city where a thousand years of empires have left their mark on every street. Often called the 'Heart of India,' it moves seamlessly between the Mughal grandeur of the Red Fort and Jama Masjid, the colonial boulevards of Lutyens' Delhi, and the glass towers of a modern megacity. Home to India Gate, bustling bazaars, world-class museums, and legendary street food, Delhi offers an intensity and depth of history that few cities anywhere can match.",
    landmark: "India Gate",
  },
  {
    slug: "mangalore",
    name: "Mangalore",
    src: "/landmarks/mangalore.svg",
    video: "https://wtwgvnxh9686e7fz.public.blob.vercel-storage.com/videos/mangalore-BBsly8q1hezeJAB9AWOQlrEWbmDIT0.mp4",
    state: "Karnataka, India",
    population: "0.8 Million",
    nickname: "Gateway of Karnataka",
    language: "Tulu & Kannada",
    climate: "Tropical monsoon",
    description:
      "Mangalore is Karnataka's principal port city, set between the Arabian Sea and the lush Western Ghats on the state's picturesque coastline. Known as the 'Gateway of Karnataka,' it is the cultural heart of the Tulu-speaking region, famed for its ancient temples, ornate churches, golden beaches, and fiery coastal cuisine built around fresh seafood and coconut. A major hub for banking, education, and trade, Mangalore balances the energy of a busy port and growing commercial center with the unhurried warmth of a traditional coastal town.",
    landmark: "Kadri Manjunatha Temple",
  },
  {
    slug: "chennai",
    name: "Chennai",
    src: "/landmarks/chennai.svg",
    video: "https://wtwgvnxh9686e7fz.public.blob.vercel-storage.com/videos/chennai-UkxiBFG49AUOjkdsragQhBrrhxmD1F.mp4",
    state: "Tamil Nadu, India",
    population: "12.3 Million",
    nickname: "Detroit of India",
    language: "Tamil",
    climate: "Tropical wet and dry",
    description:
      "Chennai is Tamil Nadu's capital and one of India's great cultural and industrial powerhouses, stretching along the Bay of Bengal with Marina Beach at its heart. Known as the 'Detroit of India' for its massive automobile industry, the city is equally celebrated as the guardian of classical Tamil culture — home to Carnatic music, Bharatanatyam dance, and magnificent temples crowned by towering gopurams. With thriving IT corridors, historic neighborhoods like Mylapore, and a deep-rooted culinary tradition, Chennai blends industrial might with timeless South Indian heritage.",
    landmark: "Kapaleeshwarar Temple Gopuram",
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    src: "/landmarks/mumbai.svg",
    state: "Maharashtra, India",
    population: "22.1 Million",
    nickname: "City of Dreams",
    language: "Marathi",
    climate: "Tropical, humid",
    description:
      "Mumbai is India's financial capital and largest city, a coastal megacity built on ambition, resilience, and relentless energy. Known as the 'City of Dreams,' it is home to Bollywood, the Bombay Stock Exchange, and some of Asia's most valuable real estate — yet its true character lives in local trains, street food stalls, and the sea breeze along Marine Drive. From the iconic Gateway of India and colonial Victorian architecture to gleaming skyscrapers, Mumbai is a city where every arrival carries a dream and every street tells a story.",
    landmark: "Gateway of India",
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    src: "/landmarks/hyderabad.svg",
    state: "Telangana, India",
    population: "11.3 Million",
    nickname: "City of Pearls",
    language: "Telugu",
    climate: "Hot semi-arid",
    description:
      "Hyderabad is Telangana's capital and one of India's fastest-growing metros, where 400 years of Nizami heritage meets a booming global tech industry. Known as the 'City of Pearls' for its historic pearl and diamond trade, it is famed for the iconic Charminar, the majestic Golconda Fort, and its legendary biryani. On the city's western edge, HITEC City hosts giants like Microsoft, Google, and Amazon, earning it the nickname 'Cyberabad.' Hyderabad offers a rare blend of old-world royal charm and cutting-edge modern ambition.",
    landmark: "Charminar",
  },
  {
    slug: "coimbatore",
    name: "Coimbatore",
    src: "/landmarks/coimbatore.svg",
    state: "Tamil Nadu, India",
    population: "1.6 Million",
    nickname: "Manchester of South India",
    language: "Tamil",
    climate: "Warm, semi-arid",
    description:
      "Coimbatore is one of Tamil Nadu's largest and most dynamic cities, known for its strong textile heritage, engineering innovation, and entrepreneurial culture. Often called the 'Manchester of South India,' the city has grown from an industrial powerhouse into a thriving urban center with a rising IT presence. Nestled at the foothills of the Western Ghats, Coimbatore enjoys a unique geographic advantage — mountain views, cleaner air compared to larger metros, and quick access to hill stations and waterfalls. It is a place where factories operate alongside temples, and modern infrastructure exists beside deeply rooted traditions.",
    landmark: "Adiyogi Shiva Statue",
  },
];

export const getCity = (slug: string) =>
  CITY_INFO.find((c) => c.slug === slug.toLowerCase());
