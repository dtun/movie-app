import { http, HttpResponse } from "msw";

const movies = [
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
];

export const handlers = [
  http.post("http://localhost:3001/ping", () => {
    return HttpResponse.text("pong");
  }),
  http.get("https://api.example.com/movies/featured", () => {
    return HttpResponse.json(movies);
  }),
  http.get("https://api.example.com/movies/:slug", ({ params }) => {
    const movie = movies.find((m) => m.slug === params.slug);

    if (movie) return HttpResponse.json(movie);

    return new HttpResponse("Not found", { status: 404 });
  }),
];
