const fs = require("fs");
const path = require("path");
const { EJSON } = require("bson");
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const DATA_DIR = path.join(__dirname, "..", "cafe_management_db");

const FILE_TO_COLLECTION = {
  "categories.json": "categories",
  "customers.json": "customers",
  "employees.json": "employees",
  "suppliers.json": "suppliers",
  "tables.json": "tables",
  "ingredients.json": "ingredients",
  "products.json": "products",
  "reservations.json": "reservations",
  "purchase_orders.json": "purchase_orders",
  "orders.json": "orders",
  "expenses.json": "expenses",
};

const seed = async () => {
  await connectDB();
  const db = mongoose.connection.db;

  for (const [file, collectionName] of Object.entries(FILE_TO_COLLECTION)) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping ${file}: file not found.`);
      continue;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const docs = EJSON.parse(raw, { relaxed: false });
    if (!Array.isArray(docs) || docs.length === 0) {
      console.warn(`Skipping ${file}: no documents.`);
      continue;
    }

    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    await collection.insertMany(docs);
    console.log(`Seeded ${docs.length} documents into "${collectionName}".`);
  }

  await mongoose.connection.close();
  console.log("Seeding complete.");
};

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
