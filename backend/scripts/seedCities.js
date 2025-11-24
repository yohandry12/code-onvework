const path = require("path");
const db = require(path.join(__dirname, "..", "src", "models"));
const cities = require(path.join(
  __dirname,
  "..",
  "src",
  "data",
  "cameroon_cities.json"
));

async function seed() {
  try {
    await db.sequelize.authenticate();
    console.log("Connected to DB");

    for (const c of cities) {
      const [city, created] = await db.City.findOrCreate({
        where: { slug: c.slug },
        defaults: {
          name: c.name,
          slug: c.slug,
          region: c.region || null,
          department: c.department || null,
          lat: c.lat || null,
          lng: c.lng || null,
          population: c.population || null,
        },
      });
      if (created) console.log("Inserted city:", city.name);
      else console.log("Already exists:", city.name);
    }

    console.log("Seeding cities complete");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding cities:", err);
    process.exit(1);
  }
}

seed();
