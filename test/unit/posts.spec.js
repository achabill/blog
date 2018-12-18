"use strict";

const { ServiceBroker } = require("moleculer");
const TestService = require("../../services/posts.service");

describe("Test 'posts' service", () => {
    let broker = new ServiceBroker();
    broker.createService(TestService);

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());
});