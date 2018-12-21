"use strict";

const DbService = require("../mixins/db.mixin");
const { MoleculerClientError } = require("moleculer").Errors;
const { ForbiddenError } = require("moleculer-web").Errors;

/**
 * posts service
 */
module.exports = {
	name: "posts",
	mixins: [new DbService("posts", process.env.POSTS_MONGODB)],

	/**
	 * Service settings
	 */
	settings: {
		fields: ["_id", "title", "body", "tagList", "starCount", "comments", "author"],
		populates: {
			author: {
				action: "users.get",
				params: {
					fields: ["username", "bio", "image"]
				}
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
		 * Create a new post
		 */
		create: {
			auth: "required",
			params: {
				title: { type: "string", min: 1 },
				body: { type: "string", min: 2 },
				tagList: { type: "array", items: "string", optional: true }
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					let post = ctx.params;
					post.author = ctx.meta.user._id;
					post.createdAt = new Date();
					post.updatedAt = new Date();
					this.adapter.insert(post)
						.then(post => resolve(this.transformDocuments(ctx, { populate: ["author"] }, post)))
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
					this.adapter.findById(ctx.params.id).then(post => {
						if (!post) {
							return reject(new MoleculerClientError("Post not found", 404));
						}
						resolve(post => this.transformDocuments(ctx, { populate: ["author"] }, post));
					}).catch(err => reject(err));
				});
			}
		},
		update: {
			auth: "required",
			params: {
				id: { type: "string" },
				post: {
					type: "object",
					props: {
						title: { type: "string", min: 1, optional: true },
						description: { type: "string", min: 1, optional: true },
						body: { type: "string", min: 1, optional: true },
						tagList: { type: "array", items: "string", optional: true }
					}
				}
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					this.adapter.findById(ctx.params.id).then(post => {
						if (!post) {
							return reject(new MoleculerClientError("post not found", 404));
						}
						if (post.author != ctx.meta.user._id) {
							return reject(new ForbiddenError());
						}
						const update = {
							"$set": ctx.params.post
						};
						this.adapter.updateById(post._id, update)
							.then(post => resolve(this.transformDocuments(ctx, { populate: ["author"] }, post)))
							.catch(err => reject(err));
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
						sort: ["-createdAt"],
						populate: ["author"]
					};

					this.adapter.find(params)
						.then(posts => resolve(this.transformDocuments(ctx, params, posts)))
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
					this.adapter.findById(ctx.params.id).then(post => {
						if (!post) {
							return reject(new MoleculerClientError("Post not found", 404));
						}
						if (post.author != ctx.meta.user._id) {
							return reject(new ForbiddenError());
						}
						this.adapter.removeById(post._id)
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