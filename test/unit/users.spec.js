"use strict";

const { ServiceBroker } = require("moleculer");
const TestService = require("../../services/users.service");

describe("Test 'users' service", () => {
    let broker = new ServiceBroker();
    broker.createService(TestService);

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());

    describe("Test 'users.create' action", () => {
        let user = {
            username: "testing",
            password: "testing123",
            bio: "I'm a tester"
        };
        it("should return user with _id", () => {
            expect.assertions(1);
            return expect(broker.call("users.create", user)).resolves.toHaveProperty("_id");
        });

        it("should reject with 'Username already exists' message", () => {
            expect.assertions(1);
            return expect(broker.call("users.create", user)).rejects.toHaveProperty("message", "Username already exists");
        });

        it("should reject with validation error", () => {
            user.username = "differentUser";
            expect(broker.call("users.create", user)).rejects.toHaveProperty("message");
        });
    });

    describe("Test 'users.login' action", () => {
        let user = {
            username: "testing",
            password: "testing123"
        };
        it("should return user along jwt", () => {
            expect(broker.call("users.login", user)).resolves.toHaveProperty("jwt");
        });

        it("should reject with 'username not found' error", () => {
            user.username = "differentUser";
            expect(broker.call("users.login", user)).rejects.toHaveProperty("message", "Username not found");
        });

        it("should reject with 'username or password incorrect' error", () => {
            user.username = "testing";
            user.password = "wrongpasssword";
            expect(broker.call("users.login", user)).rejects.toHaveProperty("message", "Username or password incorrect").then()
        });
    });
});