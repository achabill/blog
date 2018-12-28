"use strict";

const DbService = require("../mixins/db.mixin");
const { MoleculerClientError } = require("moleculer").Errors;
const { ForbiddenError } = require("moleculer-web").Errors;

/**
 * Comments service
 */
module.exports = {
	name: "comments",
	mixins: [DbService("comments", process.env.COMMENTS_MONGODB)],

	/**
	 * Service settings
	 */
	settings: {
		fields: ["_id", "post", "body", "author", "createdAt", "updatedAt"],
		populates: {
			author: {
				action: "users.get",
				params: ["_id", "username", "bio"]
			}
		},
		defaultLimit: 20,
		defaultOffset: 0
	},

	/**
	 * Service metadata
	 */
	metadata: {

	},

	/**
	 * Service dependencies
	 */
	dependencies: [],


	actions: {
		/**
		 * Create a new star
		 */
		create: {
			auth: "required",
			params: {
				post: { type: "string", min: 1 },
				body: { type: "string", min: 1 },
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					let comment = {
						post: ctx.params.post,
						body: ctx.params.body,
						author: ctx.meta.user._id,
						createdAt: new Date(),
						updatedAt: new Date()
					};
					this.adapter.insert(comment)
						.then(comment => resolve(this.transformDocuments(ctx, { populate: ["author"] }, comment)))
						.catch(err => reject(err));
				});
			}
		},

		get: {
			auth: "required",
			cache: ["#token", "id"],
			params: {
				id: { type: "string" }
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					this.adapter.findById(ctx.params.id).then(comment => {
						if (!comment) {
							return reject(new MoleculerClientError("comment not found", 404));
						}
						resolve(this.transformDocuments(ctx, {}, comment));
					}).catch(err => reject(err));
				});
			}
		},
		list: {
			auth: "required",
			cache: ["#token", "limit", "offset"],
			params: {
				limit: { type: "number", optional: true, convert: true },
				offset: { type: "number", optional: true, convert: true },
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					let limit = ctx.params.limit ? Number(ctx.params.limit) : this.settings.defaultLimit;
					let offset = ctx.params.offset ? Number(ctx.params.offset) : this.settings.defaultOffset;
					let params = {
						limit,
						offset,
						sort: ["-createdAt"]
					};

					this.adapter.find(params)
						.then(comments => resolve(this.transformDocuments(ctx, params, comments)))
						.catch(err => reject(err));
				});
			}
		},
		remove: {
			auth: "required",
			cache: ["#token", "id"],
			params: {
				id: { type: "string" }
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					this.adapter.findById(ctx.params.id).then(comment => {
						if (!comment) {
							return reject(new MoleculerClientError("comment not found", 404));
						}
						if (comment.author != ctx.meta.user._id) {
							return reject(new ForbiddenError());
						}
						this.adapter.removeById(comment._id)
							.then(resolve({}))
							.catch(err => reject(err));
					}).catch(err => reject(err));
				});
			}
		}
	},

	/**
	 * Events
	 */
	events: {
		"some.thing"(payload) {
			this.logger.info("Something happened", payload);
		}
	},

	/**
	 * Methods
	 */
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {

	}
};