<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User
        $user = User::where('email', 'test@example.com')->first();
        if (!$user) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => bcrypt('password'),
            ]);
        }

        // Categorías
        $categories = [
            [
                'name' => 'Electrónica',
                'description' => 'Dispositivos electrónicos, computadoras, celulares y accesorios.'
            ],
            [
                'name' => 'Hogar y Cocina',
                'description' => 'Muebles, electrodomésticos y decoración para el hogar.'
            ],
            [
                'name' => 'Ropa y Calzado',
                'description' => 'Prendas de vestir para todas las edades, calzado deportivo y casual.'
            ],
            [
                'name' => 'Deportes y Fitness',
                'description' => 'Equipamiento deportivo, suplementos y ropa de entrenamiento.'
            ],
            [
                'name' => 'Alimentos y Bebidas',
                'description' => 'Productos de despensa, bebidas, snacks y más.'
            ],
        ];

        $seededCategories = [];
        foreach ($categories as $cat) {
            $seededCategories[] = \App\Models\Category::firstOrCreate(
                ['name' => $cat['name']],
                ['description' => $cat['description']]
            );
        }

        // Productos de ejemplo
        $products = [
            [
                'code' => 'PROD001',
                'name' => 'Laptop Gamer Pro 15',
                'status' => true,
                'description' => 'Laptop con procesador Intel i7, 16GB RAM y tarjeta gráfica RTX 4060.',
                'category_id' => $seededCategories[0]->id,
            ],
            [
                'code' => 'PROD002',
                'name' => 'Audífonos Bluetooth ANC',
                'status' => true,
                'description' => 'Audífonos inalámbricos con cancelación activa de ruido y batería de 30 horas.',
                'category_id' => $seededCategories[0]->id,
            ],
            [
                'code' => 'PROD003',
                'name' => 'Cafetera de Goteo Programable',
                'status' => true,
                'description' => 'Cafetera con capacidad de 12 tazas, filtro permanente y temporizador digital.',
                'category_id' => $seededCategories[1]->id,
            ],
            [
                'code' => 'PROD004',
                'name' => 'Sartén Antiadherente de Cerámica',
                'status' => false,
                'description' => 'Sartén de 28cm libre de PFOA con mango ergonómico resistente al calor.',
                'category_id' => $seededCategories[1]->id,
            ],
            [
                'code' => 'PROD005',
                'name' => 'Tenis Deportivos Running',
                'status' => true,
                'description' => 'Tenis ultraligeros con amortiguación premium para corredores de larga distancia.',
                'category_id' => $seededCategories[2]->id,
            ],
            [
                'code' => 'PROD006',
                'name' => 'Chaqueta Impermeable Cortavientos',
                'status' => true,
                'description' => 'Chaqueta ligera con capucha ajustable y bolsillos con cierre térmico.',
                'category_id' => $seededCategories[2]->id,
            ],
            [
                'code' => 'PROD007',
                'name' => 'Mancuernas Ajustables 20kg',
                'status' => true,
                'description' => 'Juego de mancuernas de acero con discos intercambiables y estuche de transporte.',
                'category_id' => $seededCategories[3]->id,
            ],
            [
                'code' => 'PROD008',
                'name' => 'Tapete de Yoga Ecológico',
                'status' => false,
                'description' => 'Tapete antideslizante de 6mm de espesor fabricado con material TPE biodegradable.',
                'category_id' => $seededCategories[3]->id,
            ],
        ];

        foreach ($products as $prod) {
            \App\Models\Product::firstOrCreate(
                ['code' => $prod['code']],
                [
                    'name' => $prod['name'],
                    'status' => $prod['status'],
                    'description' => $prod['description'],
                    'category_id' => $prod['category_id'],
                ]
            );
        }
    }
}
