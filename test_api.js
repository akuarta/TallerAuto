import CharmAPI from './src/services/CharmAPI.js';

async function test() {
    try {
        console.log("Fetching Makes...");
        const makes = await CharmAPI.getMakes();
        console.log("First make:", makes[0]);
        
        const ford = makes.find(m => m.name.toLowerCase().includes('ford'));
        if (ford) {
            console.log("Fetching Years for Ford...");
            const years = await CharmAPI.getFolderItems(ford.path);
            console.log("First year for Ford:", years[0]);
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
