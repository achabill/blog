const DbService = require("moleculer-db");
const MongoAdapter = require("moleculer-db-adapter-mongo");

module.exports = function (collection, uri) {
    return {
        mixins: [DbService],
        adapter: new MongoAdapter(uri),
        collection: collection
    };
}

