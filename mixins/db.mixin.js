const DbService = require("moleculer-db");
const MongoAdapter = require("moleculer-db-adapter-mongo");

module.exports = function (collection, uri) {
    let db = {
        mixins: [DbService],
        collection: collection
    };

    if (process.env.NODE_ENV === "test")
        return db;

    if (!uri) {
        uri = "mongodb://localhost:27017/garriblog";
    }
    db.adapter = new MongoAdapter(uri);
    return db
}

