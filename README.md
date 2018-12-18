# GarriBlog

GarriBlog is a platform for people to share their thoughts.

This is a proof-of-concept, which demonstrates Microservice Architecture Pattern using Moleculer and Docker.

## What is Moleculer?
Moleculer is a fast, modern and powerful microservices framework for Node.js. It helps you to build efficient, reliable & scalable services. Moleculer provides many features for building and managing your microservices.

![microservices](https://moleculer.services/docs/0.13/assets/architectures/microservices.svg)

## Services
GarriBlog is decomposed into several core microservices. All of them are independently deployable applications, organized around certain business domains.

### Users service
Contains general user management.

`fields: ["_id", "username", "password", "bio", "image"]`

| Method   | Path   | Description  | Requires Auth |
| ------- |---------| -----| ---- |
| POST | /users/signup | Signs a user up and returns created user | 
| POST | /users/login | Logs in a user and returns logged in user |
| GET | /users/profile | Get user profile | x |


## Posts service
Responsible for handling posts.

`fields: ["_id", "title", "body", "tagList", "starCount", "comments", "author"]`

| Method   | Path   | Description  | Requires Auth |
| ------- |---------| -----| ---- |
| GET | /posts | Gets all posts | x
| POST | /posts | Creats a new post | x
| PUT | /posts/:id | Update the post for the gievn id | x 
| GET | /posts/:id | Get the post for the given id | x 
| DELETE | /posts/:id | Remove the post for the given id | x

## API Gateway
https://moleculer.services/docs/0.13/moleculer-web.html


### Notes.
Each service has it's own database. So all access to persistent data must go through the API gateway and pass authorization.

## Configuration

### Service Discovery
The Moleculer framework has a built-in service discovery feature. But you don’t need to use any central service discovery tool (like Zookeeper, Consul, etcd) because it is integrated into the Moleculer protocol.
This solution is a dynamic discovery. It means that the nodes don’t need to know all other nodes at starting

### Load Balancer
Moleculer has several built-in load balancing strategies. If services have multiple running instances, ServiceRegistry uses these strategies to select a node from all available nodes.
For this project, I used the round-robin strategy. This strategy selects a node based on round-robin algorithm.

moleculer.config.js
```
// Settings of Service Registry. More info: https://moleculer.services/docs/0.13/registry.html
registry: {
    // Define balancing strategy. 
    // Available values: "RoundRobin", "Random", "CpuUsage", "Latency"
    strategy: "RoundRobin",
    // Enable local action call preferring.
    preferLocal: true
}
```

### Caching
Moleculer has a built-in caching solution to cache responses of service actions.
For this project, I used Redis. Simple In-Memory cacher could also be used.

moleculer.config.js
```
// Define a cacher. More info: https://moleculer.services/docs/0.13/caching.html
cacher: "Redis",
```

### Networking

To communicate other nodes (ServiceBrokers), you need to configure a transporter. The most transporters connect to a central message broker server which is liable for message transferring among nodes. These message brokers mainly support publish/subscribe messaging pattern.

![networking](https://moleculer.services/docs/0.13/assets/networking.svg)

#### Transporters
Transporter is an important module if you are running services on multiple nodes. Transporter communicates with other nodes. It transfers events, calls requests and processes responses …etc. If a service runs on multiple instances on different nodes, the requests will be load-balanced among live nodes. There are several transporters. RabitMQ, NATS,etc..

```
// More info: https://moleculer.services/docs/0.13/networking.html
transporter: "NATS",
```

### Fault tolerance
#### Circuit Breaker
The Moleculer has a built-in circuit-breaker solution. It is a threshold-based implementation. It uses a time window to check the failed request rate. Once the threshold value is reached, it trips the circuit breaker.

#### What is the circuit breaker?
The Circuit Breaker can prevent an application from repeatedly trying to execute an operation that’s likely to fail. Allowing it to continue without waiting for the fault to be fixed or wasting CPU cycles while it determines that the fault is long lasting. The Circuit Breaker pattern also enables an application to detect whether the fault has been resolved. If the problem appears to have been fixed, the application can try to invoke the operation.

```
// Settings of Circuit Breaker. More info: https://moleculer.services/docs/0.13/fault-tolerance.html#Circuit-Breaker
circuitBreaker: {
    // Enable feature
    enabled: false,
    // Threshold value. 0.5 means that 50% should be failed for tripping.
    threshold: 0.5,
    // Minimum request count. Below it, CB does not trip.
    minRequestCount: 20,
    // Number of seconds for time window.
    windowTime: 60,
    // Number of milliseconds to switch from open to half-open state
    halfOpenTime: 10 * 1000,
    // A function to check failed requests.
    check: err => err && err.code >= 500
},
```

### Bulkhead

Bulkhead feature is implemented in Moleculer framework to control the concurrent request handling of actions.

#### What is bulkhead
https://docs.microsoft.com/en-us/azure/architecture/patterns/bulkhead
Isolate elements of an application into pools so that if one fails, the others will continue to function.

This pattern is named Bulkhead because it resembles the sectioned partitions of a ship's hull. If the hull of a ship is compromised, only the damaged section fills with water, which prevents the ship from sinking.

```
// Settings of bulkhead feature. More info: https://moleculer.services/docs/0.13/fault-tolerance.html#Bulkhead
bulkhead: {
    // Enable feature.
    enabled: false,
    // Maximum concurrent executions.
    concurrency: 10,
    // Maximum size of queue
    maxQueueSize: 100,
},
```



## Security

Every request to any microservice must pass through the gateway and get authenticated via JWT.
An action that requires auth is marked with `{auth: "required"}`

## Infrastructure automation
Deploying microservices, with their interdependence, is much more complex process than deploying monolithic application. It is important to have fully automated infrastructure. We can achieve following benefits with Continuous Delivery approach:

The ability to release software anytime
Any build could end up being a release
Build artifacts once - deploy as needed
Here is a simple Continuous Delivery workflow, implemented in this project:

![cd](https://cloud.githubusercontent.com/assets/6069066/14159789/0dd7a7ce-f6e9-11e5-9fbb-a7fe0f4431e3.png)


In this configuration, Travis CI builds tagged images for each successful git push. So, there are always latest image for each microservice on Docker Hub and older images, tagged with git commit hash. It's easy to deploy any of them and quickly rollback, if needed.

## NPM scripts

- `npm run dev`: Start development mode (load all services locally with hot-reload & REPL)
- `npm run start`: Start production mode (set `SERVICES` env variable to load certain services)
- `npm run cli`: Start a CLI and connect to production. Don't forget to set production namespace with `--ns` argument in script
- `npm run lint`: Run ESLint
- `npm run ci`: Run continuous test mode with watching
- `npm test`: Run tests & generate coverage report
- `npm run dc:up`: Start the stack with Docker Compose
- `npm run dc:down`: Stop the stack with Docker Compose

## Contributions welcome!
GarriBlog is open source, and would greatly appreciate your help. Feel free to suggest and implement improvements.
