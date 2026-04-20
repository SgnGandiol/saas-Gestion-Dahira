<?php

namespace Database\Factories;

use App\Models\Dahira;
use App\Models\Family;
use App\Models\House;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<House>
 */
class HouseFactory extends Factory
{
    protected $model = House::class;

    public function definition(): array
    {
        return [
            'dahira_id'          => Dahira::factory(),
            'family_id'          => Family::factory(),
            'label'              => null,
            'address'            => fake()->streetAddress(),
            'neighborhood'       => fake()->word(),
            'capacity'           => fake()->numberBetween(20, 60),
            'is_available'       => true,
            'min_interval_weeks' => 8,
        ];
    }

    public function unavailable(): static
    {
        return $this->state(['is_available' => false]);
    }

    public function withMinInterval(int $weeks): static
    {
        return $this->state(['min_interval_weeks' => $weeks]);
    }
}
