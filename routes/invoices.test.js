process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;
beforeEach(async () => {
  const company = await db.query(
    `INSERT INTO companies (code, name, description) 
    VALUES ('MSFT', 'Microsoft Corporation', 'The company that created Windows OS') 
    RETURNING code, name`
  );
  const invoice = await db.query(
    `INSERT INTO invoices (comp_code, amt, add_date) VALUES ('MSFT', '100', '2023-01-08') RETURNING id, comp_code, amt, add_date, paid, paid_date`
  );
  testCompany = company.rows[0];
  testInvoice = invoice.rows;
  testCompany.invoices = testInvoice.map((inv) => inv.id);
});

afterEach(async () => {
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Get a list of invoices", async () => {
    const res = await request(app).get("/invoices");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoices: [
        {
          id: testInvoice[0].id,
          comp_code: testInvoice[0].comp_code,
          amt: testInvoice[0].amt,
        },
      ],
    });
  });
});

describe("GET /invoices/:id", () => {
  test("Get one invoice", async () => {
    const res = await request(app).get(`/invoices/${testInvoice[0].id}`);
    const inv = testInvoice[0];
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: inv.id,
        comp_code: inv.comp_code,
        amt: inv.amt,
        paid: inv.paid,
        add_date: "2023-01-08T06:00:00.000Z",
        paid_date: inv.paid_date,
      },
    });
  });
});

describe("POST /invoices", () => {
  test("Post a new invoice", async () => {
    const res = await request(app).post("/invoices").send({
      comp_code: "MSFT",
      amt: "200",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "MSFT",
        amt: 200,
        add_date: expect.any(String),
        paid: false,
        paid_date: null,
      },
    });
  });
});

describe("PUT /invoices/:id", () => {
  test("Update invoice", async () => {
    const res = await request(app).put(`/invoices/${testInvoice[0].id}`).send({
      amt: 500,
      paid: false,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "MSFT",
        amt: 500,
        add_date: expect.any(String),
        paid: false,
        paid_date: null,
      },
    });
  });
});

describe("DELETE /invoices/:id", () => {
  test("Delete one invoice", async () => {
    const res = await request(app).delete(`/invoices/${testInvoice[0].id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      msg: `Deleted invoice with id: ${testInvoice[0].id}!`,
    });
  });
});