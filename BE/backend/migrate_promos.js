import db from "./database.js";

async function run() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS promos (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT NULL,
        discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
        discount_value DECIMAL(12,2) NOT NULL,
        min_purchase DECIMAL(12,2) DEFAULT 0.00,
        max_discount DECIMAL(12,2) NULL,
        quota INT UNSIGNED DEFAULT 100,
        used_count INT UNSIGNED DEFAULT 0,
        event_id BIGINT UNSIGNED NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_promo_code (code),
        INDEX idx_promo_event (event_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [orderCols] = await db.query('DESCRIBE orders');
    const existingOrderCols = orderCols.map((c) => c.Field);
    if (!existingOrderCols.includes('promo_code')) {
      await db.query('ALTER TABLE orders ADD COLUMN promo_code VARCHAR(50) NULL AFTER total_amount');
    }
    if (!existingOrderCols.includes('discount_amount')) {
      await db.query('ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(12,2) DEFAULT 0.00 AFTER promo_code');
    }
    if (!existingOrderCols.includes('original_amount')) {
      await db.query('ALTER TABLE orders ADD COLUMN original_amount DECIMAL(12,2) NULL AFTER discount_amount');
    }

    await db.query(`
      INSERT IGNORE INTO promos (code, description, discount_type, discount_value, min_purchase, max_discount, quota, is_active)
      VALUES 
      ('LOUDERFEST', 'Diskon Spesial Festival 15%', 'percentage', 15.00, 100000.00, 150000.00, 200, 1),
      ('HEMAT50K', 'Potongan langsung Rp 50.000', 'fixed', 50000.00, 200000.00, 50000.00, 100, 1),
      ('EARLYBIRD', 'Promo Early Bird 20%', 'percentage', 20.00, 0.00, 300000.00, 50, 1);
    `);

    const [promos] = await db.query('SELECT * FROM promos');
    console.table(promos);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
