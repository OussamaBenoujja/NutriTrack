const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    
    try {
        console.log('Setting up NutriTrack database...');
        
        // Connect to MySQL server (without specifying database)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        // Create database
        await connection.execute('CREATE DATABASE IF NOT EXISTS NutriTrackDB');
        console.log('✅ Database NutriTrackDB created successfully');

        // Use the database
        await connection.execute('USE NutriTrackDB');
        console.log('✅ Connected to NutriTrackDB');

        // Create users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INT NOT NULL AUTO_INCREMENT,
                email VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NULL,
                last_name VARCHAR(100) NULL,
                birth_date DATE NULL,
                weight DECIMAL(5,2) NULL COMMENT 'ex: 75.50 kg',
                height INT NULL COMMENT 'en cm',
                activity_level VARCHAR(50) NULL COMMENT 'ex: \'sedentary\', \'moderate\', \'active\'',
                health_conditions VARCHAR(500) NULL COMMENT 'Any health problems or conditions',
                profile_type VARCHAR(100) NOT NULL COMMENT '"Diabète", "Athlète", "Perte de poids"',
                description TEXT NULL,
                creation_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id),
                UNIQUE INDEX email_UNIQUE (email ASC)
            ) ENGINE = InnoDB
        `);
        console.log('✅ Users table created successfully');

        // Create nutrition_plans table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS nutrition_plans (
                plan_id INT NOT NULL AUTO_INCREMENT,
                user_id INT NOT NULL,
                target_calories DECIMAL(10,2) NULL,
                target_proteins DECIMAL(10,2) NULL,
                target_carbs DECIMAL(10,2) NULL,
                target_fats DECIMAL(10,2) NULL,
                max_sodium DECIMAL(10,2) NULL COMMENT 'en mg',
                max_sugar DECIMAL(10,2) NULL COMMENT 'en g',
                start_date DATE NOT NULL,
                is_active TINYINT(1) NULL DEFAULT 1,
                PRIMARY KEY (plan_id),
                INDEX fk_nutrition_plans_users_idx (user_id ASC),
                CONSTRAINT fk_nutrition_plans_users
                    FOREIGN KEY (user_id)
                    REFERENCES users (user_id)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION
            ) ENGINE = InnoDB
        `);
        console.log('✅ Nutrition plans table created successfully');

        // Create recommendations table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS recommendations (
                recommendation_id INT NOT NULL AUTO_INCREMENT,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                type VARCHAR(50) NOT NULL COMMENT '"Alerte Médicale", "Conseil Sportif"',
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                is_read TINYINT(1) NULL DEFAULT 0,
                PRIMARY KEY (recommendation_id),
                INDEX fk_recommendations_users_idx (user_id ASC),
                CONSTRAINT fk_recommendations_users
                    FOREIGN KEY (user_id)
                    REFERENCES users (user_id)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION
            ) ENGINE = InnoDB
        `);
        console.log('✅ Recommendations table created successfully');

        // Create weekly_reports table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS weekly_reports (
                report_id INT NOT NULL AUTO_INCREMENT,
                user_id INT NOT NULL,
                week_start_date DATE NOT NULL,
                week_end_date DATE NOT NULL,
                nutritional_summary JSON NULL COMMENT 'ex: {"avg_calories": 2100, "sodium_alerts": 3}',
                weight_evolution JSON NULL COMMENT 'ex: {"start_weight": 75.5, "end_weight": 74.8}',
                performance_notes TEXT NULL,
                generated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (report_id),
                INDEX fk_weekly_reports_users_idx (user_id ASC),
                CONSTRAINT fk_weekly_reports_users
                    FOREIGN KEY (user_id)
                    REFERENCES users (user_id)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION
            ) ENGINE = InnoDB
        `);
        console.log('✅ Weekly reports table created successfully');

        console.log('\n🎉 Database setup completed successfully!');
        console.log('You can now run your app with: node src/app.js');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.log('\nPlease check your MySQL configuration:');
        console.log('1. Make sure MySQL is running');
        console.log('2. Check your .env file credentials');
        console.log('3. Try running: mysql -u root -p');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
