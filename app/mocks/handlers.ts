import { http, HttpResponse, delay, graphql, passthrough, bypass } from "msw";
import { graphql as executeGraphql, buildSchema } from "graphql";

const customerService = graphql.link("https://api.example.com/review-service");

const schema = buildSchema(`
  type Movie {
    id: ID!
    title: String!
    slug: String!
    category: String!
    releasedAt: String!
    description: String!
    imageUrl: String!
  }

  type Review {
    id: ID!
    text: String!
    rating: Int!
    author: User!
  }

  type User {
    id: ID!
    firstName: String!
    avatarUrl: String!
  }

  input UserInput {
    id: ID!
    firstName: String!
    avatarUrl: String!
  }

  input ReviewInput {
    movieId: ID!
    text: String!
    rating: Int!
  }

  type Query {
    reviews(movieId: ID!): [Review!]
  }

  type Mutation {
    addReview(author: UserInput!, reviewInput: ReviewInput!): Review
  }
`);

const reviews = [
  {
    id: "04be0fb5-19f6-411c-9257-bcef6cd203c2",
    text: "One of my favorite films of all time.",
    rating: 5,
    author: {
      firstName: "Kate",
      avatarUrl: "https://i.pravatar.cc/100?img=1",
    },
  },
];

const movies = [
  {
    id: "8061539f-f0d6-4187-843f-a25aadf948eb",
    slug: "the-shawshank-redemption",
    title: "The Shawshank Redemption",
    category: "Drama",
    releasedAt: new Date("1994-10-14"),
    description:
      "Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.",
    imageUrl:
      "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_FMjpg_UX1200_.jpg",
    reviews: [],
  },
  {
    id: "3342a4f2-144b-4cef-8041-676affedfbb8",
    slug: "the-godfather",
    title: "The Godfather",
    category: "Drama",
    releasedAt: new Date("1972-03-24"),
    description:
      "Don Vito Corleone, head of a mafia family, decides to hand over his empire to his youngest son Michael. However, his decision unintentionally puts the lives of his loved ones in grave danger.",
    imageUrl:
      "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_FMjpg_UY1982_.jpg",
  },
  {
    id: "b2b7e2d9-8b2e-4b7a-9b8a-7f9a0d7f7e0e",
    title: "The Dark Knight",
    slug: "the-dark-knight",
    category: "Action",
    releasedAt: new Date("2008-07-18"),
    description:
      "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    imageUrl:
      "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UY2048_.jpg",
    reviews,
  },
];

export const handlers = [
  http.post("http://localhost:3001/ping", () => {
    return HttpResponse.text("pong");
  }),
  http.get("https://api.example.com/movies/:slug/stream", async () => {
    const videoResponse = await fetch(
      "https://cdn.example.com/videos/movie.mp4"
    );
    const videoStream = videoResponse.body;
    const latencyStream = new TransformStream({
      start() {},
      async transform(chunk, controller) {
        await delay(1000);
        controller.enqueue(chunk);
      },
    });

    return new HttpResponse(
      videoStream?.pipeThrough(latencyStream),
      videoResponse
    );
  }),
  http.get("http://localhost:3001/api/featured", async ({ request }) => {
    const response = await fetch(bypass(request));
    const movies = await response.json();

    return HttpResponse.json(movies.concat(movies));
  }),
  http.get("https://api.example.com/movies/featured", async () => {
    await delay(1000);
    return HttpResponse.json(movies);
  }),
  http.get("https://api.example.com/movies/:slug", ({ params }) => {
    const movie = movies.find((m) => m.slug === params.slug);

    if (movie) return HttpResponse.json(movie);

    return new HttpResponse("Not found", { status: 404 });
  }),
  http.get("api/recommendations", async ({ request }) => {
    const url = new URL(request.url);
    const movieId = url.searchParams.get("movieId");
    const recommendations = movies.filter((m) => m.id !== movieId);

    await delay("real");

    // return HttpResponse.error(); // Failed or aborted

    if (!movieId) {
      return new HttpResponse("Missing movieId", { status: 400 });
    }

    if (movieId === "b2b7e2d9-8b2e-4b7a-9b8a-7f9a0d7f7e0e") {
      return passthrough();
    }

    if (movieId === "3342a4f2-144b-4cef-8041-676affedfbb8") {
      return new HttpResponse(null, { status: 500 });
    }

    return HttpResponse.json(recommendations.slice(0, 2));
  }),
  http.post("https://auth.provider.com/validate", async ({ request }) => {
    const data = await request.formData();
    const email = data.get("email");
    const password = data.get("password");

    if (!email || !password) {
      return new HttpResponse(null, { status: 400 });
    }

    return HttpResponse.json({
      id: "1",
      email,
      firstName: "John",
      lastName: "Doe",
      avatarUrl: "https://avatars.dicebear.com/api/avataaars/johndoe.svg",
    });
  }),
  customerService.query("ListReviews", async () => {
    return HttpResponse.json({
      data: {
        serviceReviews: [
          {
            id: "04be0fb5-19f6-411c-9257-bcef6cd203c2",
            message: "One of my favorite films of all time.",
          },
        ],
      },
    });
  }),
  graphql.operation(async ({ query, variables }) => {
    const { errors, data } = await executeGraphql({
      schema,
      source: query,
      variableValues: variables,
      rootValue: {
        reviews(args) {
          const movie = movies.find((m) => m.id === args.movieId);

          return movie?.reviews ?? [];
        },
        addReview(args) {
          const { author, reviewInput } = args;
          const { movieId, ...review } = reviewInput;
          const movie = movies.find((m) => m.id === movieId);
          const newReview = {
            ...review,
            id: Math.random().toString(36).slice(2),
            author,
          };
          const prevReviews = movie?.reviews ?? [];

          if (!movie) {
            throw new Error(`Movie with ID "${movieId}" not found.`);
          }

          if (movie?.reviews) movie.reviews = prevReviews.concat(newReview);

          return newReview;
        },
      },
    });

    return HttpResponse.json({ errors, data });
  }),
];
