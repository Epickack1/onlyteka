require('dotenv').config();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Product = require('../models/Product');

// Стартовый каталог. Поля строго под модель Product:
// title, category, description, price (число), stock (целое).
const SEED_PRODUCTS = [
    {
        title: 'Магний B6 форте, таблетки, 60 шт.',
        category: 'Витамины',
        description: 'Восполнение дефицита магния и витамина B6, поддержка нервной системы.',
        price: 650,
        stock: 40
    },
    {
        title: 'Витамин D3 2000 МЕ, капсулы, 90 шт.',
        category: 'Витамины',
        description: 'Поддержка иммунитета и здоровья костей. Курс на 3 месяца.',
        price: 1200,
        stock: 35
    },
    {
        title: 'Нурофен Экспресс, капсулы 200 мг, 16 шт.',
        category: 'Обезболивающие',
        description: 'Быстрое жаропонижающее и обезболивающее средство (ибупрофен).',
        price: 420,
        stock: 60
    },
    {
        title: 'Парацетамол, таблетки 500 мг, 20 шт.',
        category: 'Обезболивающие',
        description: 'Жаропонижающее и обезболивающее при простуде и головной боли.',
        price: 95,
        stock: 120
    },
    {
        title: 'La Roche-Posay Effaclar, гель для умывания, 200 мл',
        category: 'Косметика',
        description: 'Очищающий гель для жирной и проблемной кожи, склонной к высыпаниям.',
        price: 1450,
        stock: 25
    },
    {
        title: 'Аскорбиновая кислота, драже 50 мг, 200 шт.',
        category: 'Витамины',
        description: 'Витамин C для поддержки иммунитета в сезон простуд.',
        price: 80,
        stock: 0
    }
];

async function seedAdminUser() {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (!email || !password) {
        console.warn('[Seed] SEED_ADMIN_EMAIL/PASSWORD не заданы — пропускаем админа');
        return;
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
        console.log(`[Seed] Админ ${email} уже существует`);
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
        email,
        first_name: 'Admin',
        last_name: 'Root',
        password: hashedPassword,
        role: 'admin'
    });
    console.log(`[Seed] ✅ Админ создан: ${email}`);
}

async function seedProducts() {
    // Идемпотентность: засеваем каталог только если таблица пуста,
    // иначе при каждом перезапуске сервера товары бы дублировались.
    const count = await Product.count();
    if (count > 0) {
        console.log(`[Seed] Товары уже есть (${count}) — пропускаем`);
        return;
    }

    await Product.bulkCreate(SEED_PRODUCTS);
    console.log(`[Seed] ✅ Засеяно товаров: ${SEED_PRODUCTS.length}`);
}

// Один вход для всего сидинга. index.js вызывает эту функцию как и раньше.
const seedDatabase = async () => {
    if (process.env.SEED_ENABLED !== 'true') {
        console.log('[Seed] Пропущен (SEED_ENABLED != true)');
        return;
    }

    await seedAdminUser();
    await seedProducts();
};

module.exports = seedDatabase;
