import { http } from "msw";

export const handlers = [
  http.get("https://api.example.com/movies/featured", () => {
    return new Response(
      JSON.stringify([
        {
          id: 1,
          title: "Inception",
          slug: "inception",
          category: "Science Fiction",
          imageUrl: "https://example.com/inception.jpg",
          releasedAt: "2010-07-16",
          description:
            "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        },
        {
          id: 2,
          title: "The Dark Knight",
          slug: "the-dark-knight",
          category: "Action",
          imageUrl: "https://example.com/the-dark-knight.jpg",
          releasedAt: "2008-07-18",
          description:
            "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept",
        },
      ]),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }),
];
