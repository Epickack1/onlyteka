// server/graphql/typeDefs.js
// GraphQL-схема для практики 26. Покрывает основные сущности проекта:
// Product, Review, User, Order, OrderItem.

const typeDefs = `#graphql
    scalar DateTime

    type Product {
        id: ID!
        title: String!
        category: String!
        description: String!
        price: Float!
        stock: Int!
        createdAt: DateTime
        # Вложенный резолвер: подтягиваем отзывы товара из MongoDB
        reviews: [Review!]!
    }

    type Review {
        id: ID!
        productId: ID!
        userId: ID!
        authorName: String!
        rating: Int!
        text: String!
        createdAt: DateTime
    }

    type User {
        id: ID!
        email: String!
        first_name: String!
        last_name: String!
        role: String!
    }

    type OrderItem {
        id: ID!
        productId: ID!
        quantity: Int!
        priceAtPurchase: Float!
        # Вложенный резолвер: подтягиваем товар по productId
        product: Product
    }

    type Order {
        id: ID!
        userId: ID!
        status: String!
        totalAmount: Float!
        createdAt: DateTime
        items: [OrderItem!]!
    }

    # ─── Входные типы ────────────────────────────────────────
    input CreateProductInput {
        title: String!
        category: String!
        description: String!
        price: Float!
        stock: Int
    }

    input CreateReviewInput {
        productId: ID!
        rating: Int!
        text: String!
    }

    input OrderItemInput {
        productId: ID!
        quantity: Int!
    }

    # ─── Корневые операции ───────────────────────────────────
    type Query {
        products(category: String, search: String): [Product!]!
        product(id: ID!): Product
        reviews(productId: ID!): [Review!]!
        me: User
        myOrders: [Order!]!
    }

    type Mutation {
        createProduct(input: CreateProductInput!): Product!
        createReview(input: CreateReviewInput!): Review!
        createOrder(items: [OrderItemInput!]!): Order!
    }
`;

module.exports = typeDefs;
