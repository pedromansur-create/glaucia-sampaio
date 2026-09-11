import { BOUTIQUE, INSTAGRAM, type Product } from "./catalog";

export const SITE_URL = "https://www.glauciasampaio.com";
export const SITE_NAME = "Gláucia Sampaio";
export const DEFAULT_TITLE =
  "Gláucia Sampaio | Vestidos de festa em Uberlândia — Fabulous Agilità, Agilità, Zen, Skazi";
export const DEFAULT_DESC =
  "Boutique de alta costura em Uberlândia. Vestidos para madrinhas, casamento, all white e eventos. Fabulous Agilità, Agilità, Zen e Skazi. Atendimento no WhatsApp.";
export const OG_IMAGE = `${SITE_URL}/og.jpg`;

export function absUrl(path = "/") {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageHead(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  type?: "website" | "product";
}) {
  const url = absUrl(opts.path);
  const title = opts.title.includes(SITE_NAME) ? opts.title : `${opts.title} | ${SITE_NAME}`;
  const image = opts.image?.startsWith("http") ? opts.image : absUrl(opts.image || "/og.jpg");
  return {
    meta: [
      { title },
      { name: "description", content: opts.description },
      { name: "robots", content: opts.noindex ? "noindex, nofollow" : "index, follow" },
      { name: "author", content: BOUTIQUE.legalName },
      { name: "geo.region", content: "BR-MG" },
      { name: "geo.placename", content: "Uberlândia" },
      { property: "og:type", content: opts.type ?? "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: title },
      { property: "og:description", content: opts.description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: opts.description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function orgJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ClothingStore", "LocalBusiness"],
    name: SITE_NAME,
    legalName: BOUTIQUE.legalName,
    taxID: BOUTIQUE.cnpj,
    url: SITE_URL,
    image: OG_IMAGE,
    telephone: BOUTIQUE.phone,
    email: "contato@glauciasampaio.com.br",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua Rodolfo Correa, 385 — Vila Povoa",
      addressLocality: "Uberlândia",
      addressRegion: "MG",
      postalCode: BOUTIQUE.cep,
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -18.9186,
      longitude: -48.2772,
    },
    openingHours: "Mo-Sa 10:00-19:00",
    priceRange: "$$$",
    sameAs: [INSTAGRAM],
    areaServed: "BR",
  };
}

export function productJsonLd(p: Product) {
  const url = absUrl(`/produto/${p.slug}`);
  const images = (p.images.length ? p.images : [OG_IMAGE]).map((src) => absUrl(src));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: `${p.name} ${p.brand}. ${p.composition || p.fabric}. ${p.description}`.slice(0, 300),
    image: images,
    sku: p.sku,
    brand: { "@type": "Brand", name: p.brand },
    material: p.composition || p.fabric,
    category: p.category,
    url,
    countryOfOrigin: "BR",
    audience: { "@type": "PeopleAudience", suggestedGender: "female", geographicArea: "BR" },
    keywords: [p.brand, ...p.occasions, p.fabric, "Uberlândia", "vestido festa"].filter(Boolean).join(", "),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BRL",
      price: p.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "BR" },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "BR",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };
}

export function collectionJsonLd(title: string, path: string, products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: absUrl(path),
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 40).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absUrl(`/produto/${p.slug}`),
        name: p.name,
      })),
    },
  };
}

export function jsonLdScript(data: unknown) {
  return JSON.stringify(data);
}
