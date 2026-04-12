import { chunkDocuments } from "../services/rag/chunker.js";
import { executeRAG } from "../services/rag/rag.pipeline.js";
import { Router } from "express";
import { getVectorStore } from "../services/rag/vector.store.js";

const router = Router();

router.post('/', async (req, res) => {
    const { query } = req.body;

    try {
        const response = await executeRAG(query);
        res.json(response.content);
    } catch (error) {
        console.error("Error in RAG pipeline:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/ingest', async (req, res) => {
    const documents = [
        {
            id: 11,
            content: `High Level Design (HLD) provides an architectural overview of a system. It focuses on system components, their interactions, and data flow without going into implementation details.

            HLD defines system architecture such as microservices, monoliths, or event-driven systems. It includes components like load balancers, databases, APIs, and services.

            Diagrams such as system architecture diagrams and data flow diagrams are commonly used in HLD.

            Scalability, availability, and fault tolerance are key considerations in HLD.

            For example, in an e-commerce system, HLD would define services like User Service, Product Service, Order Service, and Payment Service.

            HLD acts as a blueprint for developers and stakeholders to understand the overall system.

            In summary, HLD provides a macro-level view of system design.`
        },

        {
            id: 12,
            content: `Concurrency is the ability of a system to handle multiple tasks simultaneously. It is crucial for building high-performance applications.

            Threads and processes are fundamental concepts in concurrency. Threads share memory, while processes have separate memory spaces.

            Synchronization mechanisms such as mutexes, semaphores, and locks are used to avoid race conditions.

            Deadlocks occur when two or more threads are waiting indefinitely for resources.

            Asynchronous programming models like async/await improve performance by non-blocking execution.

            Concurrency is widely used in web servers, operating systems, and distributed systems.

            Proper handling of concurrency improves system efficiency and responsiveness.

            In summary, concurrency enables efficient utilization of system resources.`
        },

        {
            id: 13,
            content: `REST APIs are a popular way to design web services. They follow the principles of Representational State Transfer.

            REST APIs use HTTP methods such as GET, POST, PUT, and DELETE to perform operations.

            Resources are identified using URLs, and data is typically exchanged in JSON format.

            Statelessness is a key principle, meaning each request contains all necessary information.

            REST APIs are widely used in modern web and mobile applications.

            Proper API design includes versioning, authentication, and error handling.

            Tools like Swagger help document APIs effectively.

            In conclusion, REST APIs enable scalable and flexible communication between systems.`
        },

        {
            id: 14,
            content: `GraphQL is a query language for APIs that allows clients to request exactly the data they need.

            Unlike REST, GraphQL uses a single endpoint and flexible queries.

            Clients can specify nested data requirements, reducing over-fetching and under-fetching.

            GraphQL uses a schema to define types and relationships.

            Resolvers handle fetching data for queries.

            It is widely used in modern frontend-backend communication.

            Tools like Apollo Client and Server simplify GraphQL implementation.

            In summary, GraphQL provides efficient and flexible API communication.`
        },

        {
            id: 15,
            content: `Microservices architecture is a design approach where applications are built as a collection of small, independent services.

            Each service is responsible for a specific functionality and communicates via APIs.

            Microservices improve scalability and maintainability.

            Services can be deployed independently, enabling faster development cycles.

            However, they introduce challenges like service communication and data consistency.

            Tools like Docker and Kubernetes are commonly used in microservices.

            Monitoring and logging are essential for managing distributed systems.

            In conclusion, microservices enable modular and scalable system design.`
        },

        {
            id: 16,
            content: `Distributed Systems consist of multiple independent computers that work together as a single system.

            They provide scalability, fault tolerance, and high availability.

            Concepts like consistency, availability, and partition tolerance are defined by the CAP theorem.

            Communication between nodes happens over networks using protocols.

            Distributed systems use techniques like replication and sharding.

            Examples include cloud systems and distributed databases.

            Handling failures and ensuring data consistency are major challenges.

            In summary, distributed systems enable large-scale computing.`
        },

        {
            id: 17,
            content: `Caching is a technique used to store frequently accessed data for faster retrieval.

            It reduces latency and improves application performance.

            Common caching systems include Redis and Memcached.

            Cache strategies include write-through, write-back, and cache-aside.

            Cache invalidation is one of the hardest problems in caching.

            Content Delivery Networks (CDNs) also use caching to serve content efficiently.

            Proper caching reduces database load and improves scalability.

            In conclusion, caching is essential for high-performance applications.`
        },

        {
            id: 18,
            content: `Load Balancing distributes incoming network traffic across multiple servers.

            It ensures no single server is overwhelmed, improving reliability and performance.

            Types include round-robin, least connections, and IP hashing.

            Load balancers can be hardware-based or software-based.

            They also provide failover capabilities.

            Popular tools include Nginx and HAProxy.

            Load balancing is crucial in high-traffic applications.

            In summary, it improves system availability and scalability.`
        },

        {
            id: 19,
            content: `DevOps is a set of practices that combines software development and IT operations.

            It aims to shorten the development lifecycle and improve deployment frequency.

            Continuous Integration (CI) ensures code changes are automatically tested.

            Continuous Deployment (CD) automates the release process.

            Tools like Jenkins, GitHub Actions, and Docker are commonly used.

            Monitoring and logging are essential components of DevOps.

            Collaboration between teams is a key principle.

            In conclusion, DevOps enhances efficiency and reliability in software delivery.`
        },

        {
            id: 20,
            content: `Event-Driven Architecture is a design pattern where systems respond to events.

            Events are changes in state, such as user actions or system updates.

            Producers generate events, and consumers react to them.

            Message brokers like Kafka and RabbitMQ facilitate communication.

            It enables loose coupling and scalability.

            Event-driven systems are widely used in real-time applications.

            They improve responsiveness and flexibility.

            In summary, event-driven architecture supports scalable and reactive systems.`
        }
    ];

    const chunks = await chunkDocuments(documents);
    console.log(chunks);
    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(chunks);
    res.send();
});

export const chatRouter  = router;