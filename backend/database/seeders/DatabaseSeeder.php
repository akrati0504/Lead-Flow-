<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Keeps only the single primary Admin account and removes all dummy sample data.
     */
    public function run(): void
    {
        // Single Primary Administrator Account
        User::updateOrCreate(
            ['email' => 'admin@leadflow.test'],
            [
                'name' => 'LeadFlow Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );
    }
}
