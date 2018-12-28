"use strict";

const DbService = require("../mixins/db.mixin");
const { MoleculerClientError } = require("moleculer").Errors;
const { ForbiddenError } = require("moleculer-web").Errors;

/**
 * follows service
 */
module.exports = {

	name: "follows",
	mixins: [DbService("follows", process.env.FOLLOWS_MONGODB)],

	/**
	 * Service settings
	 */
	settings: {
		fields: ["_id", "user", "follower"],
		populate: {
			follower: {
				action: "users.get",
				params: ["_id", "username", "bio"]
			},
			user: {
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
	//dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Adds a new follow relationship
		 */
		create: {
			auth: "required",
			params: {
				user: { type: "string", min: 1 }
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					let follower = ctx.meta.user._id;
					let user = ctx.params.user;
					if (user == follower) {
						return reject(new ForbiddenError("You cannot follow yourself"));
					}
					this.findByFollowerAndUser(follower, user).then(res => {
						if (res) {
							return reject(new MoleculerClientError("User has already been followed"));
						}
						let follow = {
							follower: follower,
							user: user,
							createdAt: new Date(),
							updatedAt: new Date()
						};
						this.adapter.insert(follow)
							.then(follow => resolve(this.transformDocuments(ctx, {}, follow)))
							.catch(err => reject(err));
					}).catch(err => reject(err));
				});
			}
		},
		/**
		 * Remove a follow relationship
		 */
		remove: {
			auth: "required",
			params: {
				user: { type: "string", min: 1 }
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					let follower = ctx.meta.user._id;
					let user = ctx.params.user;
					this.findByFollowerAndUser(follower, user).then(follow => {
						if (!follow) {
							return reject(new MoleculerClientError("User has not been followed"));
						}
						if (follow.follower != ctx.meta.user._id && follow.user != ctx.meta.user._id) {
							return reject(new ForbiddenError("You must be part of the relationship to opt out"));
						}
						this.adapter.removeById(follow._id)
							.then(() => resolve(true))
							.catch(err => reject(err));
					}).catch(err => reject(err));
				});
			}
		},
		/**
		 * The number of users 'user' is following
		 */
		followingCount: {
			cache: ["user"],
			auth: "required",
			params: {
				user: { type: "string", min: 1 }
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					this.adapter.count({ follower: ctx.params.user })
						.then(count => resolve(count))
						.catch(err => reject(err));
				});
			}
		},
		/**
		 * The number of followers 'user' has
		 */
		followersCount: {
			cache: ["user"],
			auth: "required",
			params: {
				user: { type: "string", min: 1 }
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					this.adapter.count({ user: ctx.params.user })
						.then(count => resolve(count))
						.catch(err => reject(err));
				});
			}
		},
		followers: {
			cache: ["user"],
			auth: "required",
			params: {
				user: { type: "string", min: 1 }
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					this.adapter.find({ user: ctx.params.user })
						.then(followers => resolve(this.transformDocuments(ctx, { populate: ["follower"] }, followers)))
						.catch(err => reject(err));
				});
			}
		},
		followings: {
			cache: ["user"],
			auth: "required",
			params: {
				user: { type: "string", min: 1 }
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					this.adapter.find({ follower: ctx.params.user })
						.then(follows => resolve(this.transformDocuments(ctx, { populate: ["user"] }, follows)))
						.catch(err => reject(err));
				});
			}
		},

		/**
		 * Check if 'user' is followed by 'follower'
		 */
		has: {
			cache: {
				keys: ["user"]
			},
			params: {
				user: { type: "string" },
				follower: { type: "string" },
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					this.findByFollowAndUser(ctx.params.follower, ctx.params.user)
						.then(item => resolve(!!item))
						.catch(err => reject(err));
				});
			}
		},

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
		findByFollowerAndUser(follower, user) {
			return this.adapter.findOne({ follower, user });
		}
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