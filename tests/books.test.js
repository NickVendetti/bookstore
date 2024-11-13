// books.test.js
process.env.NODE_ENV = "test"; // Set the environment to "test" so that it uses the test database

const request = require("supertest"); // Import Supertest to test HTTP requests
const app = require("../app"); // Import the Express app
const db = require("../db"); // Import the database configuration

// Add a sample book to test with
let sampleBook;

beforeAll(async () => {
    // Insert sample data into the database for testing purposes
    const result = await db.query(`
    INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES ('1234567890', 'http://a.co/eobPtX2', 'John Doe', 'English', 300, 'Test Publisher', 'Sample Book', 2022)
    RETURNING isbn, amazon_url, author, language, pages, publisher, title, year
  `);
  sampleBook = result.rows[0];
});

// Clean up the database after all tests are run
afterAll(async () => {
    await db.query("DELETE FROM books");
    await db.end();
});

describe("GET /books", () => {
    test("It should retrieve all books", async () => {
        const response = await request(app).get("/books");
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ books: expect.any(Array) });
        expect(response.body.books.length).toBeGreaterThan(0);
    });
});

describe("GET /books/:ibn", () => {
    test("It should retrieve a single book", async () => {
        const response = await request(app).get(`/books/${sampleBook.isbn}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ book: sampleBook });
    });

    test("It should return 404 for a non-existent book", async () => {
        const response = await request(app).get("/books/invalid_isbn");
        expect(response.statusCode).toBe(404);
    });
});

describe("POST /books", () => {
    test("It should create a new book with valid data", async () => {
        const newBook = {
            isbn: "0987654321",
            amazon_url: "http://amazon.com/newbook",
            author: "Jane Smith",
            language: "English",
            pages: 150,
            publisher: "New Publisher",
            title: "New Book",
            year: 2021
        };
        const response = (await request(app).post("/books")).setEncoding(newBook);
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toMatchObject(newBook);
    });

    test("It should return 400 for invalid data", async () => {
        const response = await request(app).post("/books").send({ isbn: "short" });
        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual(expect.any(Array));
    });
});

describe("PUT /books/:isbn", () => {
    test("It should update a book with valid data", async () => {
      const updatedBook = {
        amazon_url: "http://amazon.com/updated_book",
        author: "Updated Author",
        language: "French",
        pages: 320,
        publisher: "Updated Publisher",
        title: "Updated Title",
        year: 2023
      };
      const response = await request(app).put(`/books/${sampleBook.isbn}`).send(updatedBook);
      expect(response.statusCode).toBe(200);
      expect(response.body.book).toMatchObject(updatedBook);
    });
  
    test("It should return 400 for invalid data", async () => {
      const response = await request(app).put(`/books/${sampleBook.isbn}`).send({ pages: -10 });
      expect(response.statusCode).toBe(400);
      expect(response.body.errors).toEqual(expect.any(Array));
    });
  });

  describe("DELETE /books/:isbn", () => {
    test("It should delete a book", async () => {
      const response = await request(app).delete(`/books/${sampleBook.isbn}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ message: "Book deleted" });
    });
  
    test("It should return 404 for a non-existent book", async () => {
      const response = await request(app).delete("/books/nonexistent_isbn");
      expect(response.statusCode).toBe(404);
    });
  });