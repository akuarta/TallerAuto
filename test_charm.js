const CharmAPI = require('./src/services/CharmAPI').default;

async function testSearch() {
  console.log("Searching for Toyota...");
  const makes = await CharmAPI.getFolderItems('');
  const toyota = makes.find(m => m.name.toLowerCase().includes('toyota'));
  console.log("Toyota folder:", toyota);

  if (toyota) {
    console.log("Searching for 1992 in Toyota...");
    const years = await CharmAPI.getFolderItems(toyota.path);
    const y1992 = years.find(y => y.name.includes('1992'));
    console.log("1992 folder:", y1992);

    if (y1992) {
      console.log("Searching for Corolla in 1992...");
      const models = await CharmAPI.getFolderItems(y1992.path);
      const corolla = models.find(m => m.name.toLowerCase().includes('corolla'));
      console.log("Corolla folder:", corolla);
    }
  }
}

testSearch().catch(console.error);
