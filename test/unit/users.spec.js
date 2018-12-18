"use strict";

const { ServiceBroker } = require("moleculer");
const TestService = require("../../services/users.service");

describe("Test 'users' service", () => {
    let broker = new ServiceBroker();
    broker.createService(TestService);

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());
});