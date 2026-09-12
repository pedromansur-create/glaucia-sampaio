import seed from "../data/shopify-catalog.json";
import compositionMap from "../data/composition.json";
import { hydrateInventory, sizeOnHand, stockFromVariants } from "./inventory";

export type Size = "PP" | "P" | "M" | "G" | "GG";

export type Color = {
  id: string;
  name: string;
  hex: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  brand: string;
  price: number;
  compareAt?: number;
  colors: Color[];
  sizes: Size[];
  images: string[];
  category: "vestido" | "conjunto" | "calca" | "blusa" | "saia" | "praia";
  occasions: string[];
  collection: string;
  fabric: string;
  composition?: string;
  stretch: boolean;
  fit: string;
  modelNote: string;
  preorder?: { shipsFrom: string };
  isNew?: boolean;
  description: string;
  sku: string;
  completeTheLook?: string[];
  shopifyHandle?: string;
  shopifyVariants?: { id: number; size: string; color: string }[];
};

export type Occasion = {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
};

export type Muse = {
  id: string;
  name: string;
  role: string;
  height: string;
  size: Size;
  portrait: string;
  story: string;
  looks: string[];
};

export const SIZES: Size[] = ["PP", "P", "M", "G", "GG"];

export const SIZE_GUIDE: Record<Size, { bust: string; waist: string; hip: string }> = {
  PP: { bust: "80–84", waist: "62–66", hip: "88–92" },
  P: { bust: "84–88", waist: "66–70", hip: "92–96" },
  M: { bust: "88–92", waist: "70–74", hip: "96–100" },
  G: { bust: "92–96", waist: "74–78", hip: "100–104" },
  GG: { bust: "96–102", waist: "78–84", hip: "104–110" },
};

export const WELCOME_CODE = "WELCOMEGS";
export const WELCOME_RATE = 0.1;
export const FREE_SHIPPING_FROM = 1000;
export const RETURN_DAYS = 7;
export const WHATSAPP = "5534996612687";

export function whatsappUrl(text: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}
export const INSTAGRAM = "https://instagram.com/glauciasampaioboutique";
export const BOUTIQUE = {
  name: "Gláucia Sampaio",
  legalName: "RCS - COMERCIAL DE ROUPAS LTDA",
  cnpj: "21.966.130/0001-53",
  address: "Rua Rodolfo Correa, 385 — Vila Povoa",
  city: "Uberlândia, MG",
  cep: "38400-050",
  phone: "(34) 99661-2687",
  hours: "Seg a sáb · 10h–19h",
};

const ALL_SIZES: Size[] = ["PP", "P", "M", "G", "GG"];

export const products: Product[] = [
  {
    id: "176147",
    slug: "vestido-longo-ivy-basque",
    name: "Vestido Longo Ivy Basque",
    shortName: "Ivy Basque",
    brand: "Fabulous Agilità",
    price: 7296,
    colors: [{ id: "coral-capri", name: "Coral Capri", hex: "#c45b4a" }],
    sizes: ALL_SIZES,
    images: ["/looks/ivy.jpg", "/looks/ivy-2.jpg"],
    category: "vestido",
    occasions: ["eventos-noturnos", "madrinhas"],
    collection: "Verão 27",
    fabric: "Tafetá de seda com caimento estruturado",
    stretch: false,
    fit: "Cintura marcada no basque. Sem elastano — se estiver entre tamanhos, suba um.",
    modelNote: "Helena veste P. 1,75 m.",
    isNew: true,
    sku: "FA-176147",
    completeTheLook: ["blusa-eva-drapeada"],
    description:
      "O Ivy é um vestido de presença. O basque esculpe a cintura e a saia abre em volume cinematográfico — feito para o instante em que a luz do salão encontra o tecido.",
  },
  {
    id: "176465",
    slug: "vestido-longo-mayra-gola",
    name: "Vestido Longo Mayra Gola",
    shortName: "Mayra Gola",
    brand: "Fabulous Agilità",
    price: 2797,
    colors: [
      { id: "rosa-bubble", name: "Rosa Bubble", hex: "#d9a3b0" },
      { id: "azul-sardenha", name: "Azul Sardenha", hex: "#3e5463" },
      { id: "preto", name: "Preto", hex: "#1a1916" },
    ],
    sizes: ALL_SIZES,
    images: ["/looks/mayra.jpg", "/looks/lola.jpg"],
    category: "vestido",
    occasions: ["casamento-dia", "madrinhas"],
    collection: "Verão 27",
    fabric: "Crepe fluido, caimento vertical",
    stretch: false,
    fit: "Cai verdadeiro ao tamanho. A gola alta alonga o pescoço — escolha o sutiã adepto.",
    modelNote: "Marina veste P. 1,68 m.",
    preorder: { shipsFrom: "09/09/2026" },
    isNew: true,
    sku: "FA-176465",
    completeTheLook: [],
    description:
      "Gola escultural, corpo em crepe que caminha com você. O Mayra é o vestido que uma madrinha lembra anos depois — discreto de perto, inesquecível de longe.",
  },
  {
    id: "176047",
    slug: "vestido-longo-pamela-tafeta",
    name: "Vestido Longo Pamela Tafetá",
    shortName: "Pamela Tafetá",
    brand: "Fabulous Agilità",
    price: 7296,
    colors: [{ id: "rosa-bubble", name: "Rosa Bubble", hex: "#d9a3b0" }],
    sizes: ALL_SIZES,
    images: ["/looks/pamela.jpg", "/looks/fabric-coral.jpg"],
    category: "vestido",
    occasions: ["eventos-noturnos", "casamento-dia"],
    collection: "Verão 27",
    fabric: "Tafetá com volume controlado",
    stretch: false,
    fit: "Saia com estrutura. Cintura alta. Se o busto for marcado, fique no tamanho habitual.",
    modelNote: "Camila veste M. 1,72 m.",
    preorder: { shipsFrom: "09/09/2026" },
    isNew: true,
    sku: "FA-176047",
    description:
      "Tafetá que fala. O Pamela constrói um silêncio à sua volta — volume, luz, e a cor Rosa Bubble da coleção.",
  },
  {
    id: "176052",
    slug: "vestido-longo-lola-crepe",
    name: "Vestido Longo Lola Crepe",
    shortName: "Lola Crepe",
    brand: "Fabulous Agilità",
    price: 4596,
    colors: [{ id: "off-white", name: "Off White", hex: "#f3eee6" }],
    sizes: ALL_SIZES,
    images: ["/looks/lola.jpg", "/looks/lola-2.jpg"],
    category: "vestido",
    occasions: ["all-white", "casamento-dia", "madrinhas"],
    collection: "Verão 27",
    fabric: "Crepe pesado, sem brilho",
    stretch: false,
    fit: "Coluna reta. Sem elastano. Se estiver entre tamanhos, suba um.",
    modelNote: "Helena veste P. 1,75 m.",
    preorder: { shipsFrom: "09/09/2026" },
    isNew: true,
    sku: "FA-176052",
    description:
      "Arquitetura em crepe. O Lola é um vestido de linha pura — off-white absoluto para o all white, o civil ao ar livre, o jantar que pede presença sem ruído.",
  },
  {
    id: "176086",
    slug: "vestido-longo-isabela-babado",
    name: "Vestido Longo Isabela Babado",
    shortName: "Isabela Babado",
    brand: "Fabulous Agilità",
    price: 4596,
    colors: [{ id: "azul-sardenha", name: "Azul Sardenha", hex: "#3e5463" }],
    sizes: ALL_SIZES,
    images: ["/looks/isabela.jpg", "/looks/madrinha.jpg"],
    category: "vestido",
    occasions: ["madrinhas", "casamento-dia", "eventos-noturnos"],
    collection: "Verão 27",
    fabric: "Seda com babados em camadas",
    stretch: false,
    fit: "Babado começa abaixo do quadril. Cintura marcada. Cai verdadeiro ao tamanho.",
    modelNote: "Marina veste P. 1,68 m.",
    preorder: { shipsFrom: "09/09/2026" },
    isNew: true,
    sku: "FA-176086",
    description:
      "Azul Sardenha em movimento. O Isabela é o vestido de madrinha que fotografa como um jardim ao entardecer.",
  },
  {
    id: "176313",
    slug: "vestido-longo-iris-paete",
    name: "Vestido Longo Iris Paetê",
    shortName: "Iris Paetê",
    brand: "Fabulous Agilità",
    price: 4596,
    colors: [{ id: "camel", name: "Camel", hex: "#c4a574" }],
    sizes: ALL_SIZES,
    images: ["/looks/iris.jpg", "/looks/gala.jpg"],
    category: "vestido",
    occasions: ["eventos-noturnos"],
    collection: "Verão 27",
    fabric: "Paetê tom sobre tom sobre malha alinhada",
    stretch: true,
    fit: "Acompanha o corpo. Se preferir mais solto, suba um tamanho.",
    modelNote: "Camila veste M. 1,72 m.",
    isNew: true,
    sku: "FA-176313",
    description:
      "Paetê camel que bebe a luz em vez de gritá-la. O Iris é o vestido de gala para quem entra depois que a orquestra já começou.",
  },
  {
    id: "176412",
    slug: "vestido-longo-kate-linho",
    name: "Vestido Longo Kate Linho",
    shortName: "Kate Linho",
    brand: "Fabulous Agilità",
    price: 3597,
    colors: [
      { id: "azul-sardenha", name: "Azul Sardenha", hex: "#3e5463" },
      { id: "rosa-bubble", name: "Rosa Bubble", hex: "#d9a3b0" },
    ],
    sizes: ALL_SIZES,
    images: ["/looks/kate.jpg", "/looks/corsega.jpg"],
    category: "vestido",
    occasions: ["resort", "casamento-dia"],
    collection: "Verão 27",
    fabric: "Linho de alta gramatura, respirável",
    stretch: false,
    fit: "Caimento relaxado. Fica verdadeiro ao tamanho. Amassa com nobreza.",
    modelNote: "Helena veste P. 1,75 m.",
    preorder: { shipsFrom: "09/09/2026" },
    isNew: true,
    sku: "FA-176412",
    description:
      "Linho que anda. O Kate é o vestido de almoço na costa, de civil no campo, de fim de tarde que vira jantar.",
  },
  {
    id: "176014",
    slug: "vestido-longo-bruna-babado",
    name: "Vestido Longo Bruna Babado",
    shortName: "Bruna Babado",
    brand: "Fabulous Agilità",
    price: 5995,
    colors: [{ id: "azul-sardenha", name: "Azul Sardenha", hex: "#3e5463" }],
    sizes: ALL_SIZES,
    images: ["/looks/bruna.jpg", "/looks/isabela.jpg", "/looks/madrinha.jpg"],
    category: "vestido",
    occasions: ["eventos-noturnos", "madrinhas"],
    collection: "Verão 27",
    fabric: "Seda com volume romântico",
    stretch: false,
    fit: "Decote estruturado, saia com ar. Cai verdadeiro ao tamanho.",
    modelNote: "Camila veste M. 1,72 m.",
    preorder: { shipsFrom: "09/09/2026" },
    isNew: true,
    sku: "FA-176014",
    description:
      "O Bruna ocupa o terraço inteiro. Babados que pegam o vento, azul que não pede desculpas.",
  },
  {
    id: "176070",
    slug: "vestido-longo-diana-gola-alta",
    name: "Vestido Longo Diana Gola Alta",
    shortName: "Diana Gola Alta",
    brand: "Fabulous Agilità",
    price: 3795,
    colors: [
      { id: "off-white", name: "Off White", hex: "#f3eee6" },
      { id: "azul-sardenha", name: "Azul Sardenha", hex: "#3e5463" },
    ],
    sizes: ALL_SIZES,
    images: ["/looks/diana.jpg", "/looks/lola.jpg"],
    category: "vestido",
    occasions: ["all-white", "casamento-dia", "workwear"],
    collection: "Verão 27",
    fabric: "Crepe de coluna, gola esculpida",
    stretch: false,
    fit: "Gola alta justa. Sem elastano. Se o pescoço for curto, prefira o Mayra.",
    modelNote: "Helena veste P. 1,75 m.",
    preorder: { shipsFrom: "09/09/2026" },
    isNew: true,
    sku: "FA-176070",
    description:
      "Uma linha do queixo ao chão. O Diana é o vestido de quem entende que o silêncio também veste.",
  },
  {
    id: "176004",
    slug: "conjunto-claire-babados",
    name: "Conjunto Claire Babados",
    shortName: "Claire Babados",
    brand: "Fabulous Agilità",
    price: 3296,
    colors: [{ id: "creme", name: "Creme", hex: "#e8dcc8" }],
    sizes: ALL_SIZES,
    images: ["/looks/claire.jpg", "/looks/allwhite.jpg"],
    category: "conjunto",
    occasions: ["casamento-dia", "resort", "all-white"],
    collection: "Verão 27",
    fabric: "Crepe com babado artesanal",
    stretch: false,
    fit: "Top cropped com volume, saia midi. Use junto ou separe.",
    modelNote: "Marina veste P. 1,68 m.",
    preorder: { shipsFrom: "09/09/2026" },
    isNew: true,
    sku: "FA-176004",
    description:
      "Dois tempos, um look. O Claire funciona no civil de dia e no resort ao entardecer.",
  },
  {
    id: "176078",
    slug: "vestido-curto-marcela-nesgas",
    name: "Vestido Curto Marcela Nesgas",
    shortName: "Marcela Nesgas",
    brand: "Fabulous Agilità",
    price: 1996,
    colors: [{ id: "off-white", name: "Off White", hex: "#f3eee6" }],
    sizes: ALL_SIZES,
    images: ["/looks/marcela.jpg", "/looks/fabric-crepe.jpg"],
    category: "vestido",
    occasions: ["all-white", "resort", "casamento-dia"],
    collection: "Verão 27",
    fabric: "Algodão estruturado com nesgas",
    stretch: false,
    fit: "Cintura marcada, saia que abre no passo. Cai verdadeiro ao tamanho.",
    modelNote: "Helena veste P. 1,75 m.",
    preorder: { shipsFrom: "09/09/2026" },
    isNew: true,
    sku: "FA-176078",
    description:
      "Curto com intenção. As nesgas desenham o movimento — almoço, civil, o primeiro brinde.",
  },
  {
    id: "176199",
    slug: "blusa-eva-drapeada",
    name: "Blusa Eva Drapeada",
    shortName: "Eva Drapeada",
    brand: "Fabulous Agilità",
    price: 997,
    colors: [{ id: "preto", name: "Preto", hex: "#1a1916" }],
    sizes: ALL_SIZES,
    images: ["/looks/eva.jpg"],
    category: "blusa",
    occasions: ["eventos-noturnos", "workwear"],
    collection: "Verão 27",
    fabric: "Seda drapeada, um ombro",
    stretch: false,
    fit: "Assimétrica. Vista com calça de alfaiataria ou saia longa.",
    modelNote: "Camila veste M. 1,72 m.",
    isNew: true,
    sku: "FA-176199",
    completeTheLook: ["calca-detalhe-prega"],
    description:
      "Um drapeado que substitui o colar. A Eva é a peça que transforma a calça que você já tem.",
  },
  {
    id: "alm-cors",
    slug: "saida-de-praia-corsega",
    name: "Saída de Praia Córsega",
    shortName: "Córsega",
    brand: "Fabulous Al Mare",
    price: 1996,
    colors: [{ id: "ivory", name: "Ivory", hex: "#f7f3ec" }],
    sizes: ALL_SIZES,
    images: ["/looks/corsega.jpg", "/looks/sardegna.jpg"],
    category: "praia",
    occasions: ["resort"],
    collection: "Al Mare",
    fabric: "Linho aberto, vento incluído",
    stretch: false,
    fit: " Oversized. Vista P se quiser mais corpo, M se quiser caftan.",
    modelNote: "Helena veste P. 1,75 m.",
    sku: "AM-CORS",
    completeTheLook: ["saia-longa-sardegna"],
    description:
      "A peça que o Mediterrâneo pediria se falasse português. Linho, mar, e nada mais.",
  },
  {
    id: "alm-sard",
    slug: "saia-longa-sardegna",
    name: "Saia Longa Sardegna",
    shortName: "Sardegna",
    brand: "Fabulous Al Mare",
    price: 2297,
    colors: [{ id: "mar", name: "Mar e Areia", hex: "#c9d4d1" }],
    sizes: ALL_SIZES,
    images: ["/looks/sardegna.jpg", "/looks/corsega.jpg"],
    category: "saia",
    occasions: ["resort"],
    collection: "Al Mare",
    fabric: "Linho estampado em rapport artesanal",
    stretch: false,
    fit: "Cós elástico interno, caimento longo. Fica verdadeiro ao tamanho.",
    modelNote: "Marina veste P. 1,68 m.",
    sku: "AM-SARD",
    completeTheLook: ["saida-de-praia-corsega"],
    description:
      "A saia que conta a costa. Use com o Córsega ou com um top simples — o resto o vento faz.",
  },
  {
    id: "ag-fivela",
    slug: "calca-cos-fivela",
    name: "Calça Cós Fivela",
    shortName: "Cós Fivela",
    brand: "Agilità",
    price: 1197,
    colors: [{ id: "ivory", name: "Ivory", hex: "#f3eee6" }],
    sizes: ALL_SIZES,
    images: ["/looks/workwear.jpg", "/looks/allwhite.jpg"],
    category: "calca",
    occasions: ["workwear", "all-white"],
    collection: "Alfaiataria",
    fabric: "Alfaiataria com queda reta",
    stretch: true,
    fit: "Cintura alta, fivela marcada. Cai verdadeiro ao tamanho.",
    modelNote: "Helena veste P. 1,75 m.",
    sku: "AG-FIV",
    completeTheLook: ["blusa-eva-drapeada"],
    description:
      "A calça da agenda. Fivela como joia, perna que alonga o passo do escritório ao jantar.",
  },
  {
    id: "ag-prega",
    slug: "calca-detalhe-prega",
    name: "Calça Detalhe Prega",
    shortName: "Prega",
    brand: "Agilità",
    price: 1397,
    colors: [{ id: "preto", name: "Preto", hex: "#1a1916" }],
    sizes: ALL_SIZES,
    images: ["/looks/prega.jpg"],
    category: "calca",
    occasions: ["workwear", "eventos-noturnos"],
    collection: "Alfaiataria",
    fabric: "Lã fria com prega frontal",
    stretch: true,
    fit: "Prega que libera o passo. Cintura alta. Fica verdadeiro ao tamanho.",
    modelNote: "Camila veste M. 1,72 m.",
    sku: "AG-PREGA",
    completeTheLook: ["blusa-eva-drapeada"],
    description:
      "Prega como arquitetura. Preta, precisa, pronta para o palco do cotidiano.",
  },
  {
    id: "ag-degrade",
    slug: "top-drape-alca-degrade",
    name: "Top Drape Alça Degradê",
    shortName: "Drape Degradê",
    brand: "Agilità",
    price: 208.5,
    compareAt: 695,
    colors: [{ id: "degrade", name: "Coral / Névoa", hex: "#c9a9a0" }],
    sizes: ALL_SIZES,
    images: ["/looks/degrade.jpg"],
    category: "blusa",
    occasions: ["resort"],
    collection: "Arquivo",
    fabric: "Malha drapeada com estampa degradê",
    stretch: true,
    fit: "Ajusta no corpo. Vista o tamanho habitual.",
    modelNote: "Marina veste P. 1,68 m.",
    sku: "AG-DEG",
    description:
      "Arquivo da casa, agora com 50%. Um drapeado que parece aquarela — para o resort e o fim de tarde.",
  },
  {
    id: "fa-barbara",
    slug: "conjunto-barbara",
    name: "Conjunto Barbara",
    shortName: "Barbara",
    brand: "Fabulous Agilità",
    price: 2196,
    colors: [{ id: "creme", name: "Creme", hex: "#e8dcc8" }],
    sizes: ALL_SIZES,
    images: ["/looks/claire.jpg", "/looks/workwear.jpg"],
    category: "conjunto",
    occasions: ["casamento-dia", "workwear"],
    collection: "Arquivo",
    fabric: "Crepe de conjunto",
    stretch: false,
    fit: "Top e calça coordenados. Cai verdadeiro ao tamanho.",
    modelNote: "Marina veste P. 1,68 m.",
    sku: "FA-BARB",
    description:
      "Do arquivo de inverno, ainda inteiro. O Barbara é o conjunto de quem veste a cidade como um ateliê.",
  },
  {
    id: "litt-white",
    slug: "camisa-litt-ivory",
    name: "Camisa Litt Ivory",
    shortName: "Litt Ivory",
    brand: "LITT",
    price: 890,
    colors: [{ id: "ivory", name: "Ivory", hex: "#f7f3ec" }],
    sizes: ALL_SIZES,
    images: ["/looks/allwhite.jpg"],
    category: "blusa",
    occasions: ["all-white", "workwear", "resort"],
    collection: "Essenciais",
    fabric: "Linho italiano, manga alongada",
    stretch: false,
    fit: "Oversized consciente. Vista um tamanho abaixo se quiser mais corpo.",
    modelNote: "Helena veste P. 1,75 m.",
    sku: "LT-IV",
    completeTheLook: ["calca-cos-fivela"],
    description:
      "A camisa que o all white pede. Litt, linho, e a luz de Uberlândia passando por ela.",
  },
  {
    id: "skazi-noite",
    slug: "vestido-skazi-noite",
    name: "Vestido Skazi Noite",
    shortName: "Skazi Noite",
    brand: "Skazi",
    price: 1890,
    colors: [{ id: "camel", name: "Camel", hex: "#c4a574" }],
    sizes: ALL_SIZES,
    images: ["/looks/gala.jpg", "/looks/iris.jpg"],
    category: "vestido",
    occasions: ["eventos-noturnos"],
    collection: "Noite",
    fabric: "Malha brilhante de baixo brilho",
    stretch: true,
    fit: "Justo. Se preferir conforto para dançar, suba um.",
    modelNote: "Camila veste M. 1,72 m.",
    sku: "SK-NOI",
    description:
      "Skazi para a hora em que a cidade acende. Um vestido de festa que ainda respira.",
  },
];

export const occasions: Occasion[] = [
  {
    slug: "casamento-dia",
    title: "Casamento de dia",
    subtitle: "Civil, jardim, almoço no campo.",
    image: "/looks/madrinha.jpg",
  },
  {
    slug: "eventos-noturnos",
    title: "Eventos noturnos",
    subtitle: "Gala, jantar, o salão depois das 20h.",
    image: "/looks/gala.jpg",
  },
  {
    slug: "resort",
    title: "Resort & férias",
    subtitle: "Al Mare. Linho, mar, vento.",
    image: "/looks/corsega.jpg",
  },
  {
    slug: "workwear",
    title: "Workwear chic",
    subtitle: "Alfaiataria que atravessa o dia.",
    image: "/looks/workwear.jpg",
  },
  {
    slug: "madrinhas",
    title: "Madrinhas",
    subtitle: "Presença sem ofuscar a noiva.",
    image: "/looks/isabela.jpg",
  },
  {
    slug: "all-white",
    title: "All White",
    subtitle: "Off-white, marfim, silêncio.",
    image: "/looks/allwhite.jpg",
  },
];

export const muses: Muse[] = [
  {
    id: "helena",
    name: "Helena",
    role: "Casa",
    height: "1,75 m",
    size: "P",
    portrait: "/looks/ivy.jpg",
    story: "Veste o Ivy, o Lola, o Kate — linha reta, tecido que não pede explicação.",
    looks: [
      "vestido-longo-ivy-basque",
      "vestido-longo-lola-crepe",
      "vestido-longo-kate-linho",
      "vestido-longo-diana-gola-alta",
      "vestido-curto-marcela-nesgas",
      "saida-de-praia-corsega",
    ],
  },
  {
    id: "marina",
    name: "Marina",
    role: "Casa",
    height: "1,68 m",
    size: "P",
    portrait: "/looks/mayra.jpg",
    story: "Veste o Mayra, o Isabela, o Claire — o que uma madrinha precisa no corpo.",
    looks: [
      "vestido-longo-mayra-gola",
      "vestido-longo-isabela-babado",
      "conjunto-claire-babados",
      "saia-longa-sardegna",
      "conjunto-barbara",
      "top-drape-alca-degrade",
    ],
  },
  {
    id: "camila",
    name: "Camila",
    role: "Casa",
    height: "1,72 m",
    size: "M",
    portrait: "/looks/pamela.jpg",
    story: "Veste o Pamela, o Iris, o Bruna — a noite no tecido certo.",
    looks: [
      "vestido-longo-pamela-tafeta",
      "vestido-longo-iris-paete",
      "vestido-longo-bruna-babado",
      "blusa-eva-drapeada",
      "calca-detalhe-prega",
      "vestido-skazi-noite",
    ],
  },
];

export const collections = [
  {
    slug: "novidades",
    title: "Novidades",
    filter: (p: Product) =>
      Boolean(p.isNew) ||
      p.collection === "Verão 27" ||
      /verao-27|verão 27|inverno-26/i.test(`${p.slug} ${p.shopifyHandle ?? ""} ${p.name} ${p.collection}`),
  },
  { slug: "verao-27", title: "Verão 27", filter: (p: Product) => p.collection === "Verão 27" },
  { slug: "vestidos", title: "Vestidos", filter: (p: Product) => p.category === "vestido" },
  { slug: "conjuntos", title: "Conjuntos", filter: (p: Product) => p.category === "conjunto" },
  { slug: "blusas", title: "Blusas", filter: (p: Product) => p.category === "blusa" },
  { slug: "calcas", title: "Calças", filter: (p: Product) => p.category === "calca" },
  { slug: "saias", title: "Saias", filter: (p: Product) => p.category === "saia" },
  { slug: "al-mare", title: "Al Mare", filter: (p: Product) => p.category === "praia" || /al mare/i.test(p.brand) || p.collection === "Al Mare" },
  { slug: "fabulous", title: "Fabulous Agilità", filter: (p: Product) => /fabulous/i.test(p.brand) },
  { slug: "agilita", title: "Agilità", filter: (p: Product) => p.brand === "Agilità" || p.brand === "Agilita" },
  { slug: "zen", title: "Zen", filter: (p: Product) => /zen/i.test(p.brand) },
  { slug: "skazi", title: "Skazi", filter: (p: Product) => /skazi/i.test(p.brand) },
  { slug: "arquivo", title: "Sale", filter: (p: Product) => Boolean(p.compareAt && p.compareAt > p.price) },
  { slug: "sale", title: "Sale", filter: (p: Product) => Boolean(p.compareAt && p.compareAt > p.price) },
  {
    slug: "casamento",
    title: "Casamento",
    filter: (p: Product) => p.occasions.includes("madrinhas") || p.occasions.includes("casamento-dia"),
  },
  {
    slug: "noite",
    title: "Noite",
    filter: (p: Product) => p.occasions.includes("eventos-noturnos"),
  },
  {
    slug: "all-white",
    title: "All White",
    filter: (p: Product) => p.occasions.includes("all-white"),
  },
];

let hydrated: Product[] | null = null;
let catalogVersion = 0;
const catalogListeners = new Set<() => void>();

export function subscribeCatalog(fn: () => void) {
  catalogListeners.add(fn);
  return () => catalogListeners.delete(fn);
}

export function catalogStamp() {
  return catalogVersion;
}

function bumpCatalog() {
  catalogVersion += 1;
  catalogListeners.forEach((fn) => fn());
}

function fold(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function inferOccasions(tags: string[], type: string, title: string): string[] {
  const hay = fold(`${tags.join(" ")} ${type} ${title}`);
  const o = new Set<string>();
  if (/madrinha|casamento|civil/.test(hay)) o.add("madrinhas");
  if (/midi|longo/.test(hay)) {
    o.add("madrinhas");
    o.add("casamento-dia");
  }
  if (/off[-\s]?white|all white|branco|marfim|nude|cru|palha|bege|champagne|offwhite|ivory/.test(hay)) {
    o.add("all-white");
  }
  if (/praia|al mare|biquini|maio|saida|linho|resort/.test(hay)) o.add("resort");
  if (/blazer|camisa|alfaiat|workwear/.test(hay)) o.add("workwear");
  if (/longo|paete|festa|gala|noite|brilho|tule|bordado/.test(hay)) o.add("eventos-noturnos");
  return [...o];
}

function categoryFromType(type: string): Product["category"] {
  const t = type.toLowerCase();
  if (t.includes("calça") || t.includes("calca") || t.includes("jeans")) return "calca";
  if (t.includes("saia")) return "saia";
  if (t.includes("conjunto")) return "conjunto";
  if (t.includes("praia") || t.includes("biquini") || t.includes("maiô") || t.includes("maio") || t.includes("saida"))
    return "praia";
  if (t.includes("blusa") || t.includes("camisa") || t.includes("top") || t.includes("regata")) return "blusa";
  return "vestido";
}

function productFromSeed(raw: {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  type: string;
  tags: string[];
  price: number;
  compare: number | null;
  images: string[];
  occasions: string[];
}): Product {
  const title = raw.title.replace(/\s+COLE[CÇ][AÃ]O.*$/i, "").trim();
  const hay = `${raw.handle} ${raw.tags.join(" ")} ${raw.title}`.toLowerCase();
  const isVerao27 = hay.includes("verao-27") || hay.includes("verão 27");
  return {
    id: raw.id,
    slug: raw.handle,
    name: title,
    shortName: title.replace(/^vestido (longo|curto|midi)\s+/i, "").slice(0, 48),
    brand: raw.vendor || "Gláucia Sampaio",
    price: raw.price,
    compareAt: raw.compare ?? undefined,
    colors: [{ id: "unico", name: "Única", hex: "#c9bfb2" }],
    sizes: ALL_SIZES,
    images: raw.images.length ? raw.images : ["/looks/hero-portrait.jpg"],
    category: categoryFromType(raw.type),
    occasions: Array.from(new Set([...(raw.occasions ?? []), ...inferOccasions(raw.tags, raw.type, raw.title)])),
    collection: isVerao27 ? "Verão 27" : hay.includes("al-mare") ? "Al Mare" : "Casa",
    fabric: raw.type || "Tecido da coleção",
    composition:
      (compositionMap as Record<string, string>)[raw.handle] ||
      raw.type ||
      "Composição na etiqueta da peça",
    stretch: false,
    fit: "Cai verdadeiro ao tamanho. Em dúvida, a shopper responde no WhatsApp.",
    modelNote: "",
    isNew: isVerao27 || hay.includes("inverno-26") || hay.includes("novidade"),
    description: title,
    sku: raw.handle,
    shopifyHandle: raw.handle,
    shopifyVariants: (raw as { variants?: { id?: number; size?: string; color?: string }[] }).variants
      ?.filter((v) => v.id)
      .map((v) => ({ id: Number(v.id), size: String(v.size || ""), color: String(v.color || "") })),
  };
}

export function variantIdFor(p: Product, size: string, color?: string) {
  const vars = p.shopifyVariants ?? [];
  if (!vars.length) return undefined;
  const n = size.toLowerCase();
  const c = (color || "").toLowerCase();
  return (
    vars.find((v) => v.size.toLowerCase() === n && c && v.color.toLowerCase() === c)?.id ??
    vars.find((v) => v.size.toLowerCase() === n)?.id ??
    vars[0]?.id
  );
}

export function hydrateFromShopify(items: Product[]) {
  if (!items.length) return;
  const merged = items.map((live) => {
    const local = products.find(
      (p) => p.slug === live.slug || live.slug.includes(p.slug) || live.shopifyHandle === p.slug,
    );
    if (!local) return live;
    return {
      ...local,
      slug: live.slug,
      price: live.price || local.price,
      compareAt: live.compareAt ?? local.compareAt,
      sku: live.sku || local.sku,
      shopifyHandle: live.shopifyHandle ?? local.shopifyHandle ?? live.slug,
      isNew: live.isNew ?? local.isNew,
      collection: live.collection || local.collection,
      occasions: live.occasions.length ? live.occasions : local.occasions,
      images: live.images?.length ? live.images : local.images,
      brand: live.brand || local.brand,
      composition: live.composition || local.composition || local.fabric,
      shopifyVariants: live.shopifyVariants?.length ? live.shopifyVariants : local.shopifyVariants,
    };
  });
  hydrated = merged;
  bumpCatalog();
}

export function allProducts() {
  return hydrated ?? products;
}

export function getProduct(slug: string) {
  const raw = decodeURIComponent(slug || "").trim();
  if (!raw) return undefined;
  const n = raw.toLowerCase();
  const pool = [...allProducts(), ...products];
  return (
    pool.find((p) => p.slug === raw) ??
    pool.find((p) => p.shopifyHandle === raw) ??
    pool.find((p) => p.slug.toLowerCase() === n) ??
    pool.find((p) => (p.shopifyHandle ?? "").toLowerCase() === n) ??
    pool.find((p) => n.length > 10 && (p.slug.toLowerCase().includes(n) || n.includes(p.slug.toLowerCase()))) ??
    pool.find(
      (p) =>
        n.length > 10 &&
        ((p.shopifyHandle ?? "").toLowerCase().includes(n) || n.includes((p.shopifyHandle ?? "").toLowerCase())),
    )
  );
}

export function productsForOccasion(slug: string) {
  const pool = allProducts();
  const tagged = pool.filter((p) => p.occasions.includes(slug));
  if (tagged.length >= 6) return tagged;
  const extra = pool.filter((p) => {
    if (tagged.includes(p)) return false;
    return inferOccasions([], p.fabric, `${p.name} ${p.shortName} ${p.brand}`).includes(slug);
  });
  const list = [...tagged, ...extra];
  if (list.length) return list;
  if (slug === "all-white") {
    return pool.filter((p) => /branco|white|off|nude|cru|marfim|bege|ivory/i.test(`${p.name} ${p.shortName}`));
  }
  return pool.filter((p) => p.category === "vestido");
}

export function productsForCollection(slug: string) {
  const col = collections.find((c) => c.slug === slug);
  const pool = allProducts();
  if (!col) return pool;
  const list = pool.filter(col.filter);
  return list.length ? list : pool;
}

export function searchProducts(q: string, herSize?: string) {
  const raw = q.trim();
  if (!raw) return allProducts();
  const n = fold(raw);
  const pool = allProducts();
  const sizeTok = n.match(/\b(pp|p|m|g|gg|34|36|38|40|42)\b/);
  const size = sizeTok ? sizeTok[1].toUpperCase().replace("34", "PP").replace("36", "P").replace("38", "M").replace("40", "G").replace("42", "GG") : herSize;
  const occ = inferOccasions([], "", raw);
  const wantWhite = /branco|white|off|nude|marfim|cru|palha|bege|ivory/.test(n);
  const wantNight = /noite|gala|festa|paete|brilho|bordado/.test(n);
  const wantDress = /vestido/.test(n);
  const wantSale = /sale|arquivo|desconto/.test(n);
  const scored = pool.map((p) => {
    const hay = fold([p.name, p.brand, p.shortName, p.collection, p.fabric, p.composition, ...p.occasions].join(" "));
    let s = 0;
    for (const w of n.split(/\s+/).filter((x) => x.length > 2 && !/^(pp|para|com|uma|pra)$/.test(x))) {
      if (hay.includes(w)) s += 3;
    }
    if (occ.some((o) => p.occasions.includes(o))) s += 8;
    if (wantWhite && /branco|white|off|nude|marfim|cru|palha|bege/.test(hay)) s += 6;
    if (wantNight && p.occasions.includes("eventos-noturnos")) s += 5;
    if (wantDress && p.category === "vestido") s += 2;
    if (wantSale && p.compareAt && p.compareAt > p.price) s += 4;
    if (size) {
      const on = sizeOnHand(p.shopifyHandle ?? p.slug, size);
      if (on == null) s += 1;
      else if (on > 0) s += 5;
      else s -= 8;
    }
    return { p, s };
  });
  const hit = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.p);
  return hit.length ? hit : pool.filter((p) => fold(`${p.name} ${p.brand}`).includes(n.split(/\s+/)[0] ?? n));
}

export function relatedProducts(product: Product, limit = 4) {
  const pool = allProducts().filter((p) => p.slug !== product.slug);
  const scored = pool
    .map((p) => ({
      p,
      s:
        (p.brand === product.brand ? 2 : 0) +
        p.occasions.filter((o) => product.occasions.includes(o)).length +
        (p.category === product.category ? 1 : 0),
    }))
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.p);
}

hydrateFromShopify(
  Array.isArray((seed as { products?: unknown }).products)
    ? (
        (seed as { products: Array<{
          id: string;
          handle: string;
          title: string;
          vendor: string;
          type: string;
          tags: string[];
          price: number;
          compare: number | null;
          images: string[];
          occasions: string[];
        }> }).products
      ).map(productFromSeed)
    : [],
);

export async function loadLiveCatalog() {
  const items: Product[] = [];
  const stock: ReturnType<typeof stockFromVariants>[] = [];
  for (let page = 1; page <= 8; page += 1) {
    const res = await fetch(`https://glaucia-sampaio-3.myshopify.com/products.json?limit=250&page=${page}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) break;
    const json = (await res.json()) as {
      products?: Array<{
        id: number;
        handle: string;
        title: string;
        vendor?: string;
        product_type?: string;
        tags?: string[] | string;
        images?: Array<{ src: string } | string>;
        variants?: Array<{
          price: string;
          compare_at_price?: string | null;
          option1?: string | null;
          option2?: string | null;
          available?: boolean;
        }>;
      }>;
    };
    const batch = json.products ?? [];
    if (!batch.length) break;
    for (const raw of batch) {
      const tags = Array.isArray(raw.tags) ? raw.tags : String(raw.tags ?? "").split(",").map((t) => t.trim());
      const images = (raw.images ?? [])
        .map((img) => (typeof img === "string" ? img : img.src))
        .filter(Boolean)
        .map((src) => (src.startsWith("//") ? `https:${src}` : src));
      items.push(
        productFromSeed({
          id: String(raw.id),
          handle: raw.handle,
          title: raw.title,
          vendor: raw.vendor ?? "",
          type: raw.product_type ?? "",
          tags,
          price: Number.parseFloat(String(raw.variants?.[0]?.price ?? "0")) || 0,
          compare: raw.variants?.[0]?.compare_at_price
            ? Number.parseFloat(String(raw.variants[0].compare_at_price))
            : null,
          images,
          occasions: inferOccasions(tags, raw.product_type ?? "", raw.title),
        }),
      );
      if (raw.variants?.length) stock.push(stockFromVariants(raw.handle, raw.variants));
    }
  }
  if (stock.length) hydrateInventory(stock);
  if (items.length) hydrateFromShopify(items);
  return items;
}
