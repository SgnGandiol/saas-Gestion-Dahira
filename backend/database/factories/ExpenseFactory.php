<?php

namespace Database\Factories;

use App\Models\Dahira;
use App\Models\Expense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    protected $model = Expense::class;

    public function definition(): array
    {
        return [
            'dahira_id' => Dahira::factory(),
            'label'     => fake()->sentence(4),
            'category'  => fake()->randomElement(['nourriture', 'transport', 'materiel', 'communication', 'autre']),
            'amount'    => fake()->randomElement([3000, 7500, 12000, 25000]),
            'spent_at'  => fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
        ];
    }
}
