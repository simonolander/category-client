const admin = require("firebase-admin")

admin.initializeApp({
    credential: admin.credential.cert(require("./serviceAccount.json")),
    databaseURL: "https://category-131ad.firebaseio.com"
});

const firestore = admin.firestore();

async function deleteCollection (collection) {
    if (typeof collection === "string") {
        collection = firestore.collection(collection);
    }
    const documents = await collection.listDocuments();
    for (let document of documents) {
        const collections = await document.listCollections();
        for (let collection of collections) {
            await deleteCollection(collection)
        }
        await document.delete();
        console.log(`Deleted document ${document.id}`)
    }
}

(async () => {

    const categoryCollectionName = "category";
    const categories =
        [
            require("./data/category/java-keywords"),
            require("./data/category/swedish-alphabet"),
            require("./data/category/pokemon")
        ];

    await deleteCollection(categoryCollectionName);

    for (const category of categories) {
        await firestore.collection(categoryCollectionName)
            .doc(category.id)
            .set(category)
            .then(() => console.log(`Added category ${category.name}`))
    }
})();

