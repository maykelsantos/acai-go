/* Todo o conteúdo editável do site Açaí Go fica aqui. */
window.ACAI = {
  nome: "Açaí Go Gourmet",
  cidade: "Cabo de Santo Agostinho, PE",
  /* número que aparece nos rótulos das garrafas — confirmar com o dono se é o WhatsApp */
  whatsapp: "5581992491683",
  whatsappExibido: "(81) 99249-1683",
  instagram: "acaigo.pe",
  instagramUrl: "https://www.instagram.com/acaigo.pe/",
  seguidores: "63 mil",
  /* produção de segunda a sexta; entrega até as 17h (bio do Instagram) */
  diasProducao: [1, 2, 3, 4, 5],
  horaLimiteEntrega: 17,
  tamanho: "300 ml",

  /* c1 = cor do açaí, c2 = cor da outra camada. preco: número (ex.: 12) ou null enquanto não confirmado */
  sabores: [
    { slug: "abacaxi", nome: "Abacaxi", sub: "Delícia de Abacaxi", c1: "#7A2A8E", c2: "#FFF0B8", preco: null },
    { slug: "maracuja", nome: "Maracujá", sub: "Açaí com maracujá", c1: "#6A2380", c2: "#FFD84A", preco: null },
    { slug: "morango", nome: "Morango", sub: "Açaí com morango", c1: "#7A2A8E", c2: "#F58FB4", preco: null },
    { slug: "pacoca", nome: "Paçoca", sub: "Açaí com paçoca", c1: "#6A2380", c2: "#E8C48E", preco: null },
    { slug: "trufado", nome: "Trufado", sub: "Ninho com Nutella", c1: "#6A2380", c2: "#F4E6C8", fundo: "#5A3220", preco: null }
  ],

  /* vídeos leves, em site/video/ (originais do Instagram @acaigo.pe) */
  videos: [
    { arq: "v03", legenda: "Gelada, cremosa e com camadas" },
    { arq: "v09", legenda: "Maracujá" },
    { arq: "v10", legenda: "Trufado" },
    { arq: "v05", legenda: "Abacaxi" },
    { arq: "v01", legenda: "Camada por camada" },
    { arq: "v07", legenda: "Morango e abacaxi na mão" },
    { arq: "v06", legenda: "Vitrine gelada" },
    { arq: "v04", legenda: "Maracujá, bem de perto" },
    { arq: "v08", legenda: "Chocolate escorrendo" },
    { arq: "v02", legenda: "Edição Dia da Mulher" }
  ]
};
