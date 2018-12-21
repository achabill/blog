"use strict";

const { MoleculerClientError } = require("moleculer").Errors;
const E = require("moleculer-web").Errors;
const DbService = require("../mixins/db.mixin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * users service
 */
module.exports = {

	name: "users",
	mixins: [DbService("users", process.env.USERS_MONGODB)],

	/**
	 * Service settings
	 */
	settings: {
		/** public fields */
		fields: ["_id", "username", "bio", "image"],
		JWT_SECRET: process.env.JWT_SECRET || "secret",
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

	/**
	 * Actions
	 */
	actions: {
		create: {
			params: {
				username: { type: "string", min: 2, max: 24 },
				password: { type: "string", min: 8 },
				bio: { type: "string", optional: true },
				image: { type: "string", optional: true }
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					let user = ctx.params;
					this.adapter.findOne({ username: user.username }).then(found => {
						if (found) {
							return reject(new MoleculerClientError("Username already exists", 409));
						}
						user.password = bcrypt.hashSync(user.password, 10);
						user.bio = user.bio || "";
						user.image = user.image || "";
						user.createdAt = new Date();
						user.updatedAt = new Date();

						this.adapter.insert(user)
							.then(user => resolve(this.transformUser(user, true, ctx.meta.token)))
							.catch(err => reject(err));
					}).catch(err => reject(err));
				});
			}
		},
		login: {
			params: {
				username: { type: "string", min: 2, max: 24 },
				password: { type: "string", min: 8 }
			},
			handler(ctx) {
				const { username, password } = ctx.params
				return new Promise((resolve, reject) => {
					this.adapter.findOne({ username: username }).then(user => {
						if (!user) {
							return reject(new MoleculerClientError("Username not found", 404));
						}
						bcrypt.compare(password, user.password)
							.then(res => res ? resolve(this.transformUser(user, true, ctx.meta.token))
								: reject(new MoleculerClientError("Username or password incorrect", 401))
							).catch(err => reject(err));
					});
				});
			}
		},
		profile: {
			auth: "required",
			cache: {
				keys: ["#token"]
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					this.getById(ctx.meta.user._id).then(user => {
						if (!user) {
							return reject(new MoleculerClientError("User not found", 404));
						}
						return resolve(this.transformUser(user, true, ctx.meta.token));
					}).catch(err => reject(new MoleculerClientError(err.message)));
				});
			}
		}
	},
	resolveToken: {
		cache: {
			keys: ["token"],
			ttl: 60 * 60
		},
		params: {
			token: { type: "string" }
		},
		handler(ctx) {
			return new Promise((resolve, reject) => {
				try {
					let decoded = jwt.verify(ctx.params.token, this.settings.JWT_SECRET);
					this.getById(decoded.id)
						.then(user => resolve(user))
						.catch(err => reject(err));
				} catch (err) {
					return reject(err);
				}
			});
		}
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Generate a JWT
		 * @param {object} user 
		 */
		generateJWT(user) {
			let d = new Date();
			d.setMinutes(d.getMinutes() + 30);
			return jwt.sign({
				id: user._id,
				username: user.username,
				exp: Math.floor(d.getTime() / 1000)
			}, this.settings.JWT_SECRET);
		},

		/**
		 * Transform entity to user object
		 * 
		 * @param {object} user 
		 * @param {boolean} isWithToken 
		 * @param {string} token 
		 */
		transformUser(user, isWithToken, token) {
			if (isWithToken) {
				user.jwt = token || this.generateJWT(user);
			}
			return user;
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
}