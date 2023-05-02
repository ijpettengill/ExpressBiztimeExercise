process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;
let testIndustry;
beforeEach(async () => {
  const company = await db.query(
    `INSERT INTO companies (code, name, description) 
    VALUES ('MSFT', 'Microsoft Corporation', 'The company that created Windows OS') 
    RETURNING code, name, description`
  );
  const invoice = await db.query(
    `INSERT INTO invoices (comp_code, amt, add_date) VALUES ('MSFT', '100', '2023-01-08') RETURNING id, comp_code, amt, add_date, paid, paid_date`
  );

  const industries = await db.query(
    `INSERT INTO industries (id, name) VALUES ('1', 'Tech') RETURNING id, name`
  );
  const comp_ind = await db.query(`INSERT INTO comp_ind (comp_code, ind_id) VALUES ('MSFT', '1') RETURNING comp_code, ind_id`);
  testCompany = company.rows[0];
  testInvoice = invoice.rows;
  testIndustry = industries.rows;
  testCompany.invoices = testInvoice.map((inv) => inv.id);
  testCompany.industries = ["Tech"];
  console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
  console.log(testCompany);
});

afterEach(async () => {
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM industries");
  await db.query("DELETE FROM comp_ind");
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Get a list of companies", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      companies: [{ code: "MSFT", name: "Microsoft Corporation" }],
    });
  });
});

describe("GET /companies/:code", () => {
  test("Get a single company", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: testCompany,
    });
  });
  test("Get a single company", async () => {
    const res = await request(app).get("/companies/0");
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("Create a new company", async () => {
    const res = await request(app).post("/companies").send({
      code: "GOOG",
      name: "Google",
      description: "Made popular search engine",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: "GOOG",
        name: "Google",
        description: "Made popular search engine",
      },
    });
  });
});

describe("PUT /companies/:code", () => {
  test("Updates a company", async () => {
    const res = await request(app).put(`/companies/${testCompany.code}`).send({
      name: "Microsoft",
      description: "The company that made VSCode",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: testCompany.code,
        name: "Microsoft",
        description: "The company that made VSCode",
      },
    });
  });
});

describe("DELETE /companies/:code", () => {
  test("DELETE a single company", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ msg: `Deleted ${testCompany.code}!` });
  });
  test("Fail to DELETE a single company", async () => {
    const res = await request(app).get("/companies/0");
    expect(res.statusCode).toBe(404);
  });
});